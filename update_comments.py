#!/usr/bin/env python3
import json
import subprocess
import sys

# Read the JSON file
with open('pr_comments.json', 'r') as f:
    data = json.load(f)

# Get current commit hash
commit_hash = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()

# Comments that need to be updated
pending_comments = [
    {
        'id': 2203532565,
        'message': '✅ Addressed in commit ' + commit_hash + ' - Fixed parameter reassignment by using local variables instead of reassigning parameters'
    },
    {
        'id': 2203532568,
        'message': '✅ Addressed in commit ' + commit_hash + ' - Fixed parameter reassignment by using local variables instead of reassigning parameters'
    },
    {
        'id': 2203704189,
        'message': '✅ Addressed in commit ' + commit_hash + ' - Fixed parameter reassignment by using local variables instead of reassigning parameters'
    },
    {
        'id': 2203704191,
        'message': '✅ Addressed in commit ' + commit_hash + ' - Fixed parameter reassignment by using local variables instead of reassigning parameters'
    },
    {
        'id': 2203704193,
        'message': '✅ Addressed in commit ' + commit_hash + ' - Fixed parameter reassignment by using local variables instead of reassigning parameters'
    }
]

# Update each comment
for comment in pending_comments:
    comment_id = comment['id']
    message = comment['message']
    
    # Get the original comment to preserve its structure
    original_comment = None
    for c in data:
        if c['id'] == comment_id:
            original_comment = c
            break
    
    if not original_comment:
        print(f"Comment {comment_id} not found")
        continue
    
    # Update the body with the new message
    original_body = original_comment['body']
    updated_body = original_body + '\n\n' + message
    
    # Make the API call
    cmd = [
        'curl', '-X', 'PATCH',
        '-H', 'Authorization: token $GITHUB_PAT',
        '-H', 'Accept: application/vnd.github.v3+json',
        '-d', json.dumps({'body': updated_body}),
        f'https://api.github.com/repos/appliedmedia/gmail-2-trello/pulls/comments/{comment_id}'
    ]
    
    print(f"Updating comment {comment_id}...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Successfully updated comment {comment_id}")
    else:
        print(f"❌ Failed to update comment {comment_id}: {result.stderr}")

print("Done updating comments!")