#!/bin/bash
# Builds media/pitchfeed-demo.mp4 from scenes/*.png + macOS "say" narration. Needs ffmpeg.
set -e
cd "$(dirname "$0")"
VOICE="${VOICE:-Samantha}"; RATE="${RATE:-175}"
W=tmp; rm -rf $W; mkdir -p $W
# segment | images (space separated) | narration
cat > $W/script.txt <<'TXT'
01-title|This is Pitchfeed. Swipe right on your first customers.
02-problem|First-time founders have a great product, but no network, and no sales playbook. And A.I. sales tools made it worse, blasting out generic, made-up emails that get ignored, or banned.
03-solution|Pitchfeed sends fewer, truer messages. It finds organizations with a real reason to talk right now, shows who can introduce you, and drafts a note you approve with a swipe. Every claim comes with a receipt.
04-intake|Start by describing your product, and your background.
05-thinking|A crew of four agents, running on Band, reads it, searches public pages, and checks every quote against its source.
06-icp|You get an ideal customer profile, with a confidence score on every field. Add the segments you like, then approve.
07-feed|Here's your feed. Each card is a real reason to reach out: the exact quote and its source, a fit score, and a drafted email.
08a-receipt 08b-path|Flip the card for the proof receipt. Then open the warm path, from you, through a fellow alum, to the buyer.
09-edit|Edit the draft, and the checks update live. A hype word like, guarantee, blocks the send.
10-credit|Only you can approve. Each send costs six credits, metered by Flexprice. When you run out, Security pauses enrichment until you top up.
11-signals|The crew keeps watching. New signals arrive already verified, and agents ask your permission before they change the graph.
12a-pipeline 12b-insights 12c-wrapped|Track every lead on the pipeline, see what's working in Insights, and replay your week as Founder Wrapped.
13-activity|Every action is logged, with who did it, and what it cost.
14-outro|Pitchfeed. Few, true, well-timed messages. Try it live today.
TXT
n=0; : > $W/list.txt
while IFS='|' read -r imgs text; do
  n=$((n+1)); seg=$(printf "%02d" $n)
  say -v "$VOICE" -r "$RATE" -o $W/$seg.aiff "$text"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $W/$seg.aiff)
  total=$(echo "$dur + 0.7" | bc)
  set -- $imgs; k=$#; per=$(echo "scale=3; $total / $k" | bc)
  i=0
  for img in "$@"; do
    i=$((i+1)); frames=$(printf "%.0f" $(echo "$per * 30" | bc))
    ffmpeg -nostdin -loglevel error -y -loop 1 -i scenes/$img.png -t $per \
      -vf "scale=1600:1000,fps=30,format=yuv420p" \
      -c:v libx264 -preset veryfast -crf 24 $W/$seg-$i.mp4
  done
  # join this segment's clips, then lay the narration under it (0.35s lead-in)
  : > $W/s$seg.txt; for c in $W/$seg-*.mp4; do echo "file '$(basename $c)'" >> $W/s$seg.txt; done
  ffmpeg -nostdin -loglevel error -y -f concat -safe 0 -i $W/s$seg.txt -c copy $W/v$seg.mp4
  ffmpeg -nostdin -loglevel error -y -i $W/v$seg.mp4 -i $W/$seg.aiff -filter_complex "[1]adelay=350|350,apad[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest $W/seg$seg.mp4
  echo "file 'seg$seg.mp4'" >> $W/list.txt
  echo "segment $seg ${total}s"
done < $W/script.txt
ffmpeg -nostdin -loglevel error -y -f concat -safe 0 -i $W/list.txt -c copy -movflags +faststart pitchfeed-demo.mp4
rm -rf $W
ffprobe -v error -show_entries format=duration,size -of default=nw=1 pitchfeed-demo.mp4
