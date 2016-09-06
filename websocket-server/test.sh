#!/bin/bash
# Send test mondo hook request to our service
read -d '' json << EOF

{
 "title":"Title",
    "package":"test.notification",
    "text":"text",
    "textLines":"textlines"
 }

EOF

echo "$json"

curl -X POST -H "Content-Type: application/json" "localhost:8988" -d "$json"
