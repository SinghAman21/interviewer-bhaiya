#!/bin/bash

# Start the frontend (in 'front' directory) in the background
(cd front && pnpm run dev) &

# Start the backend (in 'back' directory) in the background
(cd back && python main.py) &

# Wait for both processes to finish
wait
