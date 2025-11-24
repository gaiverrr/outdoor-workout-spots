#!/bin/bash

# Image Optimization Script
# Resizes images to 800px max dimension with WebP quality 80

SOURCE_DIR="real-data/images"
BACKUP_DIR="real-data/images-backup"
MAX_SIZE=800
QUALITY=80

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Image Optimization Script ===${NC}"
echo "Source: $SOURCE_DIR"
echo "Max dimension: ${MAX_SIZE}px"
echo "WebP quality: $QUALITY"
echo ""

# Count total images
total_images=$(find "$SOURCE_DIR" -type f -name "*.webp" | wc -l | tr -d ' ')
echo -e "${BLUE}Total images to process: $total_images${NC}"
echo ""

# Ask for confirmation
read -p "Create backup before optimization? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Creating backup...${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        echo "Backup directory already exists. Skipping backup."
    else
        cp -r "$SOURCE_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}Backup created at $BACKUP_DIR${NC}"
    fi
fi
echo ""

# Process images
count=0
size_before=0
size_after=0

echo -e "${BLUE}Starting optimization...${NC}"

find "$SOURCE_DIR" -type f -name "*.webp" | while read -r img; do
    count=$((count + 1))

    # Get file size before
    size_before_bytes=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    size_before=$((size_before + size_before_bytes))

    # Create temporary output file
    temp_file="${img}.tmp.webp"

    # Optimize image: resize to max 800px on longest side, quality 80
    magick "$img" -resize "${MAX_SIZE}x${MAX_SIZE}>" -quality $QUALITY "$temp_file" 2>/dev/null

    if [ -f "$temp_file" ]; then
        # Get file size after
        size_after_bytes=$(stat -f%z "$temp_file" 2>/dev/null || stat -c%s "$temp_file" 2>/dev/null)

        # Replace original with optimized
        mv "$temp_file" "$img"

        size_after=$((size_after + size_after_bytes))

        # Show progress every 100 images
        if [ $((count % 100)) -eq 0 ]; then
            percent=$((count * 100 / total_images))
            echo -e "${GREEN}Progress: $count/$total_images ($percent%)${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: Failed to process $img${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== Optimization Complete ===${NC}"
echo "Processed: $total_images images"

# Calculate final stats
final_size=$(du -sh "$SOURCE_DIR" | awk '{print $1}')
echo "Final size: $final_size"
