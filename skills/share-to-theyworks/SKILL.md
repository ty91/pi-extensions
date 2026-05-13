---
name: share-to-theyworks
description: Upload an HTML file to the theyworks-share S3 bucket via the theyworks-share-html-uploader Lambda and return the public URL. Use ONLY WHEN asked to share or publish an HTML file to Theyworks.
---

# Share to Theyworks

1. Request a presigned upload URL:

```bash
curl -sS -X POST \
  -H 'content-type: application/json' \
  -d '{"key":"theyworks123!@#"}' \
  'https://re2n37tztdss45ei5ligin4ioa0kboza.lambda-url.ap-southeast-2.on.aws/'
```

2. Save `upload.url`, `upload.headers`, and `url` from the JSON response.

3. Upload the HTML file with the exact headers from `upload.headers`:

```bash
curl -sS -X PUT \
  -H 'content-type: text/html; charset=utf-8' \
  -H 'cache-control: no-cache' \
  -H 'x-amz-server-side-encryption: AES256' \
  --data-binary '@/path/to/index.html' \
  '<upload.url>'
```

4. Verify the returned public `url` responds with HTTP 200.

5. Give the public `url` to the user.
