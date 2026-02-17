import os
import pandas as pd
import glob

def convert_parquet_to_csv():
    # Find all parquet files recursively in the current directory
    parquet_files = glob.glob('**/*.parquet', recursive=True)
    
    if not parquet_files:
        print("No .parquet files found.")
        return

    print(f"Found {len(parquet_files)} parquet files.")

    for file_path in parquet_files:
        try:
            print(f"Converting {file_path}...")
            df = pd.read_parquet(file_path)
            csv_path = file_path.replace('.parquet', '.csv')
            df.to_csv(csv_path, index=False)
            print(f"Saved to {csv_path}")
        except Exception as e:
            print(f"Failed to convert {file_path}: {e}")

if __name__ == "__main__":
    convert_parquet_to_csv()
