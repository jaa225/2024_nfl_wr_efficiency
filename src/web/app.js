document.addEventListener('DOMContentLoaded', () => {
    const teamSelect = document.getElementById('team-select');
    const playerSelect = document.getElementById('player-select');
    const dashboard = document.getElementById('dashboard');
    const loading = document.getElementById('loading');

    let allPlayers = []; // Full list of player objects

    // Load Data
    fetch('wr_data.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allPlayers = data;
            initializeControls();
            loading.style.display = 'none';
        })
        .catch(error => {
            console.error('Error loading data:', error);
            loading.innerText = 'Error loading data. Please ensure you are running a local server.';
        });

    function initializeControls() {
        // Populate Team Select
        const teams = [...new Set(allPlayers.map(p => p.team))].sort();
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamSelect.appendChild(option);
        });

        // Initialize Player Select with all players
        populatePlayerSelect(allPlayers);

        // Event Listeners
        teamSelect.addEventListener('change', handleTeamChange);
        playerSelect.addEventListener('change', handlePlayerChange);
    }

    function handleTeamChange() {
        const selectedTeam = teamSelect.value;
        const filteredPlayers = selectedTeam === 'all'
            ? allPlayers
            : allPlayers.filter(p => p.team === selectedTeam);

        populatePlayerSelect(filteredPlayers);

        if (selectedTeam !== 'all') {
            // Aggregate Team Stats
            const teamStats = aggregateTeamStats(filteredPlayers, selectedTeam);
            renderPlayerDashboard(teamStats);
        } else {
            dashboard.classList.add('hidden');
        }
    }

    function aggregateTeamStats(players, teamName) {
        // Initialize aggregate object structure matching player object
        const agg = {
            id: `team-${teamName}`,
            name: `${teamName} WR Corps`,
            team: teamName,
            total_stats: { targets: 0, receptions: 0, yards: 0, tds: 0 },
            zones: []
        };

        // Helper to sum zones
        const zoneMap = {};

        players.forEach(p => {
            // Sum Totals
            agg.total_stats.targets += p.total_stats.targets;
            agg.total_stats.receptions += p.total_stats.receptions;
            agg.total_stats.yards += p.total_stats.yards;
            agg.total_stats.tds += p.total_stats.tds;

            // Sum Zones
            p.zones.forEach(z => {
                const key = `${z.depth}-${z.direction}`;
                if (!zoneMap[key]) {
                    zoneMap[key] = {
                        depth: z.depth,
                        direction: z.direction,
                        targets: 0,
                        receptions: 0,
                        yards: 0,
                        tds: 0
                    };
                }
                zoneMap[key].targets += z.targets;
                zoneMap[key].receptions += z.receptions;
                zoneMap[key].yards += z.yards;
                zoneMap[key].tds += z.tds;
            });
        });

        // Convert zoneMap back to array
        agg.zones = Object.values(zoneMap);

        return agg;
    }

    function populatePlayerSelect(players) {
        playerSelect.innerHTML = '<option value="">All WRs (Team View)</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.name} (${player.team}) - ${player.total_stats.yards} yds`;
            playerSelect.appendChild(option);
        });
        playerSelect.disabled = false;
    }

    function handlePlayerChange() {
        const playerId = playerSelect.value;
        if (!playerId) {
            // If no player selected, go back to team view if a team is selected
            if (teamSelect.value !== 'all') {
                handleTeamChange();
            } else {
                dashboard.classList.add('hidden');
            }
            return;
        }

        const player = allPlayers.find(p => p.id === playerId);
        if (player) {
            renderPlayerDashboard(player);
        }
    }

    function renderPlayerDashboard(player) {
        dashboard.classList.remove('hidden');

        // Calculate Derived Stats
        const catchRate = player.total_stats.targets > 0
            ? ((player.total_stats.receptions / player.total_stats.targets) * 100).toFixed(1)
            : "0.0";

        const ypc = player.total_stats.receptions > 0
            ? (player.total_stats.yards / player.total_stats.receptions).toFixed(1)
            : "0.0";

        // Update Info
        document.getElementById('player-name').textContent = player.name;
        document.getElementById('player-team').textContent = player.team;
        document.getElementById('total-targets').textContent = player.total_stats.targets;
        document.getElementById('total-receptions').textContent = player.total_stats.receptions;
        document.getElementById('total-yards').textContent = player.total_stats.yards;
        document.getElementById('total-tds').textContent = player.total_stats.tds;
        document.getElementById('total-catch-rate').textContent = `${catchRate}%`;
        document.getElementById('total-ypc').textContent = ypc;

        // Render Zones & Heatmap
        const zones = document.querySelectorAll('.zone');

        // Reset Zones
        zones.forEach(zone => {
            zone.style.backgroundColor = ''; // Reset heatmap
            const stats = zone.querySelector('.zone-stats');
            if (stats) stats.remove();
        });

        // 1. Calculate Average Efficiency for Player ( Yards Per Target ) to use as baseline
        const playerYPT = player.total_stats.targets > 0
            ? (player.total_stats.yards / player.total_stats.targets)
            : 0;

        // Populate Zones and Recommendation Data
        let zonePerformances = [];

        player.zones.forEach(z => {
            const selector = `.zone[data-depth="${z.depth}"][data-dir="${z.direction}"]`;
            const zoneEl = document.querySelector(selector);

            if (zoneEl) {
                // Creates stats element
                const statsDiv = document.createElement('div');
                statsDiv.className = 'zone-stats';
                statsDiv.innerHTML = `
                    <div class="zone-main-stat">${z.receptions}/${z.targets}</div>
                    <div class="zone-sub-stat">${z.yards} yds</div>
                    <div class="zone-sub-stat">${z.tds} TD</div>
                `;
                zoneEl.appendChild(statsDiv);

                // Heatmap Logic: Weighted Composite Score
                // Score = (Catch Rate * 0.4) + (YPT/10 * 0.3) + (TD Per Target * 0.1) + (Rec Share * 0.2)

                const catchRate = z.targets > 0 ? (z.receptions / z.targets) : 0; // 0-1 scale
                const zoneYPT = z.targets > 0 ? (z.yards / z.targets) : 0;
                const tdPerTarget = z.targets > 0 ? (z.tds / z.targets) : 0;
                const recShare = player.total_stats.receptions > 0 ? (z.receptions / player.total_stats.receptions) : 0;

                const cappedYPT = Math.min(zoneYPT, 15.0);
                const score = (catchRate * 0.3) + ((cappedYPT / 10) * 0.4) + (tdPerTarget * 0.2) + (recShare * 0.1) + (z.yards / 1500);

                let colorBase = '234, 179, 8'; // Yellow default
                let opacity = 0.6;

                if (z.targets < 3) {
                    // Low sample size, keep neutral or transparent
                    colorValue = `rgba(255, 255, 255, 0.05)`;
                } else {
                    if (score >= 0.90) {
                        colorBase = '34, 197, 94'; // Green

                        // Elite Threshold Check: Catch Rate must be >= 65% for high vividness
                        if (catchRate < 0.65) {
                            opacity = 0.6; // Capped for low catch rate
                        } else {
                            // Scale opacity 0.6 -> 1.0 for scores 0.90 -> 1.15+
                            opacity = 0.6 + (Math.min(score - 0.90, 0.25) / 0.25) * 0.4;
                        }
                    } else if (score >= 0.65) {
                        colorBase = '234, 179, 8'; // Yellow
                        // Scale opacity 0.4 -> 1.0 for scores 0.65 -> 0.90
                        opacity = 0.4 + ((score - 0.65) / 0.25) * 0.6;
                    } else {
                        colorBase = '239, 68, 68'; // Red
                        // Scale opacity 0.4 -> 1.0 for scores 0.0 -> 0.65
                        opacity = 0.4 + (Math.max(score, 0) / 0.65) * 0.6;
                    }

                    colorValue = `rgba(${colorBase}, ${opacity.toFixed(2)})`;
                }

                zoneEl.style.backgroundColor = colorValue;

                // Store for recommendations
                zonePerformances.push({
                    zone: `${z.depth} ${z.direction}`,
                    score: score,
                    ypt: zoneYPT,
                    targets: z.targets,
                    receptions: z.receptions,
                    tds: z.tds
                });
            }
        });

        // Generate Recommended Routes
        recommendRoutes(zonePerformances);
    }

    function recommendRoutes(zoneStats) {
        const routesList = document.getElementById('recommended-routes');
        routesList.innerHTML = '';

        // Filter for significant volume (> 3 targets)
        const validZones = zoneStats.filter(z => z.targets >= 3);

        // Sort by Score descending
        validZones.sort((a, b) => b.score - a.score);

        // Take top 3
        const topZones = validZones.slice(0, 3);

        // Map Zones to Route Concepts (Heuristic)
        const routeMap = {
            "Short Left": ["Flat", "Screen", "Slant"],
            "Short Middle": ["Slant", "Drag", "Quick In"],
            "Short Right": ["Flat", "Screen", "Hitch"],
            "Mid Left": ["Out", "Dig", "Curl"],
            "Mid Middle": ["Post", "Crosser", "Seam"],
            "Mid Right": ["Out", "Dig", "Curl"],
            "Deep Left": ["Go", "Fade", "Deep Post"],
            "Deep Middle": ["Post", "Seam", "Deep Cross"],
            "Deep Right": ["Go", "Fade", "Comeback"]
        };

        if (topZones.length === 0) {
            routesList.innerHTML = '<li>Insufficient data for specific recommendations.</li>';
            return;
        }

        topZones.forEach(z => {
            const routes = routeMap[z.zone] || ["Routes"];
            const li = document.createElement('li');
            li.innerHTML = `<strong>${z.zone}</strong>: Effectiveness suggests running <em>${routes.join(" / ")}</em>. (Score: ${z.score.toFixed(2)})`;
            routesList.appendChild(li);
        });
    }
});
