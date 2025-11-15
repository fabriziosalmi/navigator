#!/bin/bash

###############################################################################
# 🎬 Navigator Video Conversion Script
# 
# This script automates the conversion of the raw .webm recording into 
# optimized formats for different platforms.
#
# Prerequisites:
#   - ffmpeg installed: brew install ffmpeg
#
# Usage:
#   ./convert-video.sh navigator-demo-raw-20251111-162236.webm
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

INPUT_FILE=$1
OUTPUT_DIR="./video-exports"

if [ -z "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Error: No input file specified${NC}"
    echo ""
    echo "Usage: $0 <input-video.webm>"
    echo ""
    echo "Example:"
    echo "  $0 navigator-demo-raw-20251111-162236.webm"
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Error: Input file not found: $INPUT_FILE${NC}"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ Error: ffmpeg is not installed${NC}"
    echo ""
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

echo -e "${CYAN}"
echo "███╗   ██╗ █████╗ ██╗   ██╗██╗ ██████╗  █████╗ ████████╗ ██████╗ ██████╗ "
echo "████╗  ██║██╔══██╗██║   ██║██║██╔════╝ ██╔══██╗╚══██╔══╝██╔═══██╗██╔══██╗"
echo "██╔██╗ ██║███████║██║   ██║██║██║  ███╗███████║   ██║   ██║   ██║██████╔╝"
echo "██║╚██╗██║██╔══██║╚██╗ ██╔╝██║██║   ██║██╔══██║   ██║   ██║   ██║██╔══██╗"
echo "██║ ╚████║██║  ██║ ╚████╔╝ ██║╚██████╔╝██║  ██║   ██║   ╚██████╔╝██║  ██║"
echo "╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝"
echo -e "${NC}"
echo ""
echo -e "${MAGENTA}🎬 VIDEO CONVERSION PIPELINE${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

BASE_NAME=$(basename "$INPUT_FILE" .webm)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${BLUE}📹 Input file: ${NC}$INPUT_FILE"
echo -e "${BLUE}📁 Output directory: ${NC}$OUTPUT_DIR"
echo ""

###############################################################################
# 1. HIGH-QUALITY MP4 for LinkedIn/YouTube/Reddit
###############################################################################
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎥 Converting to MP4 (H.264, 1080p)...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MP4_OUTPUT="$OUTPUT_DIR/navigator-demo-social-${TIMESTAMP}.mp4"

ffmpeg -i "$INPUT_FILE" \
    -vf "scale=1920:1080:flags=lanczos" \
    -c:v libx264 \
    -preset slow \
    -crf 18 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "$MP4_OUTPUT" \
    -y

if [ -f "$MP4_OUTPUT" ]; then
    SIZE=$(du -h "$MP4_OUTPUT" | cut -f1)
    echo -e "${GREEN}✅ MP4 created: $MP4_OUTPUT ($SIZE)${NC}"
else
    echo -e "${RED}❌ Failed to create MP4${NC}"
    exit 1
fi

echo ""

###############################################################################
# 2. OPTIMIZED GIF for Twitter/GitHub README
###############################################################################
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🖼️  Converting to GIF (optimized, 720p)...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

GIF_OUTPUT="$OUTPUT_DIR/navigator-demo-readme-${TIMESTAMP}.gif"
PALETTE="/tmp/navigator-palette-${TIMESTAMP}.png"

# Generate optimized palette for GIF
ffmpeg -i "$INPUT_FILE" \
    -vf "fps=15,scale=1280:720:flags=lanczos,palettegen=stats_mode=diff" \
    "$PALETTE" \
    -y

# Create GIF using the palette
ffmpeg -i "$INPUT_FILE" -i "$PALETTE" \
    -lavfi "fps=15,scale=1280:720:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
    "$GIF_OUTPUT" \
    -y

# Clean up palette
rm -f "$PALETTE"

if [ -f "$GIF_OUTPUT" ]; then
    SIZE=$(du -h "$GIF_OUTPUT" | cut -f1)
    echo -e "${GREEN}✅ GIF created: $GIF_OUTPUT ($SIZE)${NC}"
    
    # Check if GIF is too large (>3MB for Twitter)
    SIZE_BYTES=$(stat -f%z "$GIF_OUTPUT" 2>/dev/null || stat -c%s "$GIF_OUTPUT" 2>/dev/null)
    if [ "$SIZE_BYTES" -gt 3145728 ]; then
        echo -e "${YELLOW}⚠️  Warning: GIF is larger than 3MB ($SIZE)${NC}"
        echo -e "${YELLOW}   Twitter may reject it. Consider using the MP4 instead.${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create GIF${NC}"
    exit 1
fi

echo ""

###############################################################################
# 3. ULTRA-COMPRESSED GIF for Twitter (if needed)
###############################################################################
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🐦 Creating Twitter-optimized GIF (<3MB)...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TWITTER_GIF_OUTPUT="$OUTPUT_DIR/navigator-demo-twitter-${TIMESTAMP}.gif"
PALETTE_TWITTER="/tmp/navigator-palette-twitter-${TIMESTAMP}.png"

# More aggressive compression for Twitter
ffmpeg -i "$INPUT_FILE" \
    -vf "fps=10,scale=960:540:flags=lanczos,palettegen=stats_mode=diff:max_colors=128" \
    "$PALETTE_TWITTER" \
    -y

ffmpeg -i "$INPUT_FILE" -i "$PALETTE_TWITTER" \
    -lavfi "fps=10,scale=960:540:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3" \
    "$TWITTER_GIF_OUTPUT" \
    -y

rm -f "$PALETTE_TWITTER"

if [ -f "$TWITTER_GIF_OUTPUT" ]; then
    SIZE=$(du -h "$TWITTER_GIF_OUTPUT" | cut -f1)
    echo -e "${GREEN}✅ Twitter GIF created: $TWITTER_GIF_OUTPUT ($SIZE)${NC}"
else
    echo -e "${RED}❌ Failed to create Twitter GIF${NC}"
fi

echo ""

###############################################################################
# SUMMARY
###############################################################################
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}📊 CONVERSION COMPLETE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ All files exported to: $OUTPUT_DIR${NC}"
echo ""
echo -e "${CYAN}📁 Generated files:${NC}"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{print "   • " $9 " (" $5 ")"}'
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "   1. Use ${MAGENTA}$MP4_OUTPUT${NC} for LinkedIn/YouTube/Reddit"
echo -e "   2. Use ${MAGENTA}$GIF_OUTPUT${NC} for GitHub README"
echo -e "   3. Use ${MAGENTA}$TWITTER_GIF_OUTPUT${NC} for Twitter (if < 3MB)"
echo ""
echo -e "${GREEN}✅ Ready for launch! 🚀${NC}"
