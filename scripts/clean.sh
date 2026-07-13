#!/bin/bash

# Removes specific folders and files commonly generated during dev processes.

# define folders and files to remove
folders=(
  '.cache'
  '.eslintcache'
  '.next'
  '.swc'
  '.turbo'
  'build'
  'coverage'
  'dist'
  'node_modules'
)
files=(
  'tsconfig.tsbuildinfo'
)

# remove folders
for folder in "${folders[@]}"; do
  echo "Removing all $folder folders..."
  find . -name "$folder" -type d -prune -exec rm -rf {} + -print
done

# remove files
for file in "${files[@]}"; do
  echo "Removing all $file files..."
  find . -name "$file" -type f -prune -exec rm -rf {} + -print
done

echo "Done 🎉"
