import pandas as pd
import numpy as np
import os
import json

# Define Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
RAW_DATA_DIR = os.path.join(PROJECT_DIR, "Data", "Raw")
PROCESSED_DATA_DIR = os.path.join(PROJECT_DIR, "Data", "Processed")

# Output path
OUTPUT_JSON = os.path.join(PROJECT_DIR, "src", "web", "wr_data.json")

def load_data():
    """Load raw parquet files."""
    pbp_path = os.path.join(RAW_DATA_DIR, "pbp_2024.parquet")
    roster_path = os.path.join(RAW_DATA_DIR, "rosters_2024.parquet")
    
    print(f"Loading data from {RAW_DATA_DIR}...")
    pbp = pd.read_parquet(pbp_path)
    rosters = pd.read_parquet(roster_path)
    return pbp, rosters

def process_data(pbp, rosters):
    """Process data to get WR stats by zone."""
    print("Processing data...")
    
    # 1. Filter Rosters for WRs
    # Note: rosters column names might vary, checking standard nflverse format
    # Based on notebook view: 'position', 'gsis_id', 'full_name', 'team'
    wrs = rosters[rosters['position'] == 'WR'][['player_id', 'full_name', 'team']].drop_duplicates()
    
    # 2. Filter PBP for Passes to WRs
    # Join pbp with wrs on receiver_player_id
    # 'receiver_player_id' is the standard column in pbp for target
    
    pbp_plays = pbp[
        (pbp['pass_attempt'] == 1) & 
        (pbp['two_point_attempt'] == 0) &
        (pbp['air_yards'].notna()) &
        (pbp['pass_location'].notna())
    ].copy()
    
    # Merge with WR roster to filter non-WRs
    df = pbp_plays.merge(wrs, left_on='receiver_player_id', right_on='player_id', how='inner')
    
    # 3. Define Zones
    # Depth: Short (<10), Mid (10-19), Deep (20+)
    conditions = [
        (df['air_yards'] < 10),
        (df['air_yards'] >= 10) & (df['air_yards'] < 20),
        (df['air_yards'] >= 20)
    ]
    choices = ['Short', 'Mid', 'Deep']
    df['depth_zone'] = np.select(conditions, choices, default='Unknown')
    
    # Direction: Left, Middle, Right (Title Case)
    df['direction_zone'] = df['pass_location'].str.title()
    
    # 4. Aggregate Stats
    # Group by Player, Zone
    # Metrics: Targets, Receptions, Yards, TDs
    
    # Helper for aggregates
    df['is_target'] = 1
    df['is_reception'] = df['complete_pass']
    df['yards'] = df['yards_gained'].fillna(0)
    df['is_td'] = df['touchdown']
    
    # Grouping
    zones = df.groupby(['player_id', 'full_name', 'team', 'depth_zone', 'direction_zone']).agg({
        'is_target': 'sum',
        'is_reception': 'sum',
        'yards': 'sum',
        'is_td': 'sum'
    }).reset_index()
    
    # Calculate Rates
    zones['catch_rate'] = (zones['is_reception'] / zones['is_target']).round(3)
    zones['yards_per_target'] = (zones['yards'] / zones['is_target']).round(1)
    
    # 5. Get Total Stats for Filtering (Top Players)
    totals = df.groupby(['player_id', 'full_name', 'team']).agg({
        'is_target': 'sum',
        'is_reception': 'sum',
        'yards': 'sum',
        'is_td': 'sum'
    }).reset_index()
    
    # Filter for significant players (e.g., > 20 targets)
    totals = totals[totals['is_target'] >= 20]
    
    valid_players = totals['player_id'].unique()
    zones = zones[zones['player_id'].isin(valid_players)]
    
    return totals, zones

def export_json(totals, zones):
    """Export to JSON structure for web app."""
    print(f"Exporting to {OUTPUT_JSON}...")
    
    output = []
    
    # Iterate through each unique player in totals
    for _, row in totals.iterrows():
        player_id = row['player_id']
        
        # Get zones for this player
        player_zones = zones[zones['player_id'] == player_id]
        
        zone_data = []
        for _, z_row in player_zones.iterrows():
            zone_data.append({
                "depth": z_row['depth_zone'],
                "direction": z_row['direction_zone'],
                "targets": int(z_row['is_target']),
                "receptions": int(z_row['is_reception']),
                "yards": int(z_row['yards']),
                "tds": int(z_row['is_td']),
                "catch_rate": float(z_row['catch_rate']),
                "ypt": float(z_row['yards_per_target'])
            })
            
        player_obj = {
            "id": player_id,
            "name": row['full_name'],
            "team": row['team'],
            "total_stats": {
                "targets": int(row['is_target']),
                "receptions": int(row['is_reception']),
                "yards": int(row['yards']),
                "tds": int(row['is_td'])
            },
            "zones": zone_data
        }
        output.append(player_obj)
        
    # Sort by total yards descending
    output.sort(key=lambda x: x['total_stats']['yards'], reverse=True)
    
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Successfully exported data for {len(output)} players.")

def convert_to_csv():
    """Convert raw parquet files to CSV."""
    pbp_path = os.path.join(RAW_DATA_DIR, "pbp_2024.parquet")
    roster_path = os.path.join(RAW_DATA_DIR, "rosters_2024.parquet")
    
    print(f"Converting parquet files in {RAW_DATA_DIR} to CSV...")
    
    try:
        pbp = pd.read_parquet(pbp_path)
        pbp_csv = pbp_path.replace('.parquet', '.csv')
        pbp.to_csv(pbp_csv, index=False)
        print(f"Saved {pbp_csv}")
    except Exception as e:
        print(f"Error converting pbp: {e}")
        
    try:
        rosters = pd.read_parquet(roster_path)
        roster_csv = roster_path.replace('.parquet', '.csv')
        rosters.to_csv(roster_csv, index=False)
        print(f"Saved {roster_csv}")
    except Exception as e:
        print(f"Error converting rosters: {e}")

if __name__ == "__main__":
    # convert_to_csv() # Uncomment to convert parquet to CSV
    pbp, rosters = load_data()
    totals, zones = process_data(pbp, rosters)
    export_json(totals, zones)
