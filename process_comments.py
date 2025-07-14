#!/usr/bin/env python3
import json
import re

# Read the JSON file
with open('pr_comments.json', 'r') as f:
    data = json.load(f)

print(f"Found {len(data)} comments\n")

# Process each comment
for i, comment in enumerate(data, 1):
    comment_id = comment['id']
    body = comment['body']
    original_line = comment.get('original_line', 'N/A')
    
    # Extract the main issue from the body
    lines = body.split('\n')
    issue_line = ""
    for line in lines:
        if line.startswith('**') and line.endswith('**'):
            issue_line = line.strip('*')
            break
    
    # Check if already addressed
    addressed = "✅ Addressed in commit" in body
    
    print(f"{i:2d}. ID: {comment_id}, Line: {original_line}")
    print(f"    Issue: {issue_line}")
    print(f"    Status: {'✅ ADDRESSED' if addressed else '❌ PENDING'}")
    
    if addressed:
        # Extract commit hash
        commit_match = re.search(r'commit ([a-f0-9]+)', body)
        if commit_match:
            print(f"    Commit: {commit_match.group(1)}")
    
    print()