# WR Efficiency Visualizer

A web application to visualize NFL Wide Receiver effectiveness by field zone.

## Features
- **Team Filter**: Narrow down players by NFL team.
- **Zone Visualization**: See effectiveness in 9 zones (Left/Middle/Right x Short/Mid/Deep).
    - **Short**: < 8 yards
    - **Mid**: 8-16 yards
    - **Deep**: > 16 yards
- **Heatmap**: Zones light up based on yardage production.

## How to Run

Because this website loads a local JSON file, it requires a local web server to run correctly (to avoid browser security restrictions).

### Prerequisites
- Python 3 installed.

### Steps
1. Open a terminal in this directory (`src/web`):
   ```bash
   cd "src/web"
   ```
2. Start a simple Python server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

## Data Source
The data is processed from 2024 NFL Play-by-Play data using `src/data_processing.py`.
To update the data:
1. Run `python src/data_processing.py` from the project root.
