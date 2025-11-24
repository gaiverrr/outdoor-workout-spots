#!/bin/bash

# Fast Parallel Image Optimization Script
# Resizes images to 800px max dimension with WebP quality 80

SOURCE_DIR="real-data/images"
BACKUP_DIR="real-data/images-backup"
MAX_SIZE=800
QUALITY=80
PARALLEL_JOBS=8  # Adjust based on your CPU cores

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Fast Parallel Image Optimization ===${NC}"
echo "Source: $SOURCE_DIR"
echo "Max dimension: ${MAX_SIZE}px"
echo "WebP quality: $QUALITY"
echo "Parallel jobs: $PARALLEL_JOBS"
echo ""

# Check if GNU parallel is available
if ! command -v parallel &> /dev/null; then
    echo -e "${YELLOW}GNU parallel not found. Using xargs instead (slower).${NC}"
    USE_XARGS=1
else
    echo -e "${GREEN}Using GNU parallel for faster processing.${NC}"
    USE_XARGS=0
fi
echo ""

# Count total images
total_images=$(find "$SOURCE_DIR" -type f -name "*.webp" 2>/dev/null | wc -l | tr -d ' ')
echo -e "${BLUE}Total images to process: $total_images${NC}"
echo ""

# Calculate current size
current_size=$(du -sh "$SOURCE_DIR" 2>/dev/null | awk '{print $1}')
echo "Current size: $current_size"
echo ""

# Ask for confirmation
echo -e "${YELLOW}WARNING: This will modify all images in $SOURCE_DIR${NC}"
read -p "Do you want to create a backup first? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Creating backup...${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "${RED}Backup directory already exists at $BACKUP_DIR${NC}"
        echo "Please remove or rename it first, or skip backup."
        exit 1
    else
        echo "This may take a few minutes for 5.9GB..."
        cp -r "$SOURCE_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"
    fi
    echo ""
fi

read -p "Proceed with optimization? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Optimization cancelled."
    exit 0
fi
echo ""

# Optimization function
optimize_image() {
    local img="$1"
    local max_size="$2"
    local quality="$3"

    # Create temporary output file
    local temp_file="${img}.tmp.webp"

    # Optimize image
    magick "$img" -resize "${max_size}x${max_size}>" -quality "$quality" "$temp_file" 2>/dev/null

    if [ -f "$temp_file" ]; then
        # Replace original with optimized
        mv "$temp_file" "$img"
        echo "✓" > /dev/null  # Success marker
    else
        echo "Failed: $img" >&2
    fi
}

export -f optimize_image
export MAX_SIZE
export QUALITY

echo -e "${BLUE}Starting optimization...${NC}"
echo "This will take several minutes. Progress updates every ~1000 images."
echo ""

start_time=$(date +%s)

# Process images
if [ $USE_XARGS -eq 1 ]; then
    # Using xargs (slower but available everywhere)
    find "$SOURCE_DIR" -type f -name "*.webp" -print0 | \
        xargs -0 -P "$PARALLEL_JOBS" -I {} sh -c "magick \"{}\" -resize \"${MAX_SIZE}x${MAX_SIZE}>\" -quality $QUALITY \"{}.tmp\" && mv \"{}.tmp\" \"{}\""
else
    # Using GNU parallel (faster with progress)
    find "$SOURCE_DIR" -type f -name "*.webp" | \
        parallel --bar --eta -j "$PARALLEL_JOBS" \
        "magick {} -resize ${MAX_SIZE}x${MAX_SIZE}\\> -quality $QUALITY {}.tmp && mv {}.tmp {}"
fi

end_time=$(date +%s)
duration=$((end_time - start_time))
minutes=$((duration / 60))
seconds=$((duration % 60))

echo ""
echo -e "${GREEN}=== Optimization Complete ===${NC}"
echo "Time taken: ${minutes}m ${seconds}s"

# Calculate final stats
final_size=$(du -sh "$SOURCE_DIR" 2>/dev/null | awk '{print $1}')
echo "Final size: $final_size (was: $current_size)"
echo ""
echo -e "${GREEN}✓ All $total_images images optimized!${NC}"
echo ""
echo "You can now:"
echo "  1. Test the images to ensure quality is acceptable"
echo "  2. If satisfied, remove backup: rm -rf $BACKUP_DIR"
echo "  3. Commit changes to git"
