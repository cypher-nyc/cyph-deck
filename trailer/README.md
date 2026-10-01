# Updating the trailer (trailer.cyph.city)

The page always plays one file: **`trailer/trailer.mp4`**. To change the
trailer, replace that file and push to `main`. Nothing else changes: no
code, no Terraform, no Google Sheet.

## Steps

1. **Export a web MP4 from your master.** Browsers cannot play ProRes or most
   `.mov` files. You need `ffmpeg` installed (`brew install ffmpeg`).
   Run from the `cyph-deck` folder.

   A normal video (no transparency):

   ```sh
   ffmpeg -i ~/Downloads/master.mov \
     -vf scale=1920:-2 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
     -movflags +faststart -c:a aac -b:a 160k \
     -y trailer/trailer.mp4
   ```

   A master with transparency (ProRes 4444 with alpha, like the cyphcard
   sway): put it on black first. Set `s=` to the master's size and `r=` to
   its frame rate (`ffprobe master.mov` shows both):

   ```sh
   ffmpeg -f lavfi -i color=black:s=3840x2160:r=60 -i ~/Downloads/master.mov \
     -filter_complex "[0:v][1:v]overlay=shortest=1,scale=1920:1080:flags=lanczos,format=yuv420p" \
     -c:v libx264 -preset slow -crf 20 -movflags +faststart -c:a aac -b:a 160k \
     -y trailer/trailer.mp4
   ```

   With no audio in the master, the `-c:a aac -b:a 160k` part does nothing.

2. **Check the size:** `ls -lh trailer/trailer.mp4`. It must be under
   **100 MB** (GitHub's limit per file). If it is over, run step 1 again with
   `-crf 24` (smaller file, slightly softer picture; go up to 26 if needed).

3. **Watch it once locally:** `open trailer/trailer.mp4`.

4. **Commit and push to `main`:**

   ```sh
   git add trailer/trailer.mp4
   git commit -m "trailer: <what changed>"
   git push origin main
   ```

5. **Done.** GitHub Actions ("Publish trailer.cyph.city") uploads it and
   clears the CDN cache; trailer.cyph.city serves the new cut within a minute
   or two. Check the run in the repo's Actions tab if you want to see it.

## Good to know

- **Keep the name `trailer.mp4`.** Any other name is ignored by the page.
- **Never commit the master** (`.mov`, ProRes). Only the web MP4 goes in git.
- **People who already watched** may see the old cut for up to a day (their
  browser keeps a copy). New viewers always get the new one.
- **Without GitHub Actions** (from the Mac):
  `AWS_PROFILE=cyph node tools/publish-trailer.mjs` publishes the same thing.
- **Analytics need nothing.** Every view still lands in the access sheet as
  `viewed = trailer`; the `timings` tab logs watch time per 5 seconds of
  video (`0:00`, `0:05`, ...) whatever the length. Rows from different cuts
  are told apart by their timestamp.
- **The page itself** is `trailer.html` (gate + video + autoplay). The
  hosting is cyph-terraform `trailer.tf`; it never needs to change for a new
  video.
