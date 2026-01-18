#!/bin/bash
echo "Starting git synchronization..."

# Fetch all changes from all remotes and prune deleted branches
echo "Fetching all remote branches..."
git fetch --all --prune

# Pull the latest changes for the current checked-out branch
echo "Pulling updates for the current branch..."
git pull

# List all branches (local and remote) to help you decide on merges
echo "Current Branch Status:"
git branch -a

echo "Sync complete."
