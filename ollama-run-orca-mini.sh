#!/bin/bash

# Run this script after ollama container is up.
# NOTE: You can create a new screen before running this script, allowing you to close the terminal, but still letting this script run...
docker exec -it ollama ollama run orca-mini