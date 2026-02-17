# NFL Wide Receiver Efficiency Visualizer (2024)

[**🚀 Launch Live Dashboard**](https://jakealles-cloud.github.io/2024_nfl_wr_efficieny/)  

## Project Overview
This project provides a granular analysis of NFL Wide Receiver performance during the 2024 season. Unlike standard box scores, this tool breaks down efficiency based on **field zones** (Short, Mid, Deep) and **alignment** (Left, Middle, Right).

It features a custom **Volume-Adjusted Efficiency Score** to identify receivers who are not just compiling stats, but dominating their specific zones.

## 🎯 Use Cases (Why This Matters)

### 1. Fantasy Football & Betting Analysis
*   **Draft Sleepers:** Identify receivers who have high "Deep" efficiency (Green zones) but low volume targets. These players are prime breakout candidates given more opportunity.
*   **Prop Bets:** Analyze matchup advantages. If a WR has a "High" (Green) score on "Deep Left" routes and is facing a CB who allows deep separation, it signals a high-value play.

### 2. NFL Scouting & Scheme Fit
Teams can use this tool to find players who fit specific offensive roles rather than just looking at total yards.
*   *Need a reliable Slot Receiver?* Look for Green in the "Short Middle" zone.
*   *Need a Vertical Threat?* Look for Green in the "Deep Left/Right" zones.

### 3. Defensive Game Planning
Defensive coordinators can visualize a receiver's "hot zones" to determine coverage strategies.
*   If a player is predominantly **Red** in the "Short" zones but **Green** "Deep", the defense knows to cushion the coverage and not press at the line.

---

## Technical Methodology

### 1. Data Processing
*   **Source**: Raw Play-by-Play data (`pbp_2024.parquet`) and Roster data from `nfl_data_py`.
*   **Logic**: The python pipeline filters for targets to WRs, categorizes every pass attempt into one of 9 spatial zones, and aggregates the results.

### 2. The Efficiency Score
The core of the visualization is a composite score designed to balance efficient catching with big-play ability, while penalizing low volume.

**Formula:**
```
Score = (CatchRate * 0.3) + (CappedYPT * 0.4) + (TD% * 0.2) + (TargetShare * 0.1) + (VolumeBonus)
```
*   **Catch Rate**: Reliability.
*   **YPT (Yards Per Target)**: Explosiveness (Capped at 15.0 to prevent outliers).
*   **TD%**: Scoring efficiency.
*   **Volume Bonus**: Small boost for total Yards and Targets to separate starters from bench players.

### 3. The Visualizer
*   **Tech Stack**: HTML, CSS, Vanilla JavaScript.
*   **Heatmap**:
    *   **Green**: High Efficiency (Score ≥ 0.90) + Reliable Hands (Catch Rate ≥ 65%).
    *   **Yellow**: Above Average (Score 0.65 - 0.89).
    *   **Red**: Below Average / Low Volume.
*   **Route Recommendations**: The app suggests optimal routes (e.g., "Deep Left") based on where the receiver scores highest.

---
*Created for MSBA Spring 2026 Project.*