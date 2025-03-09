#!/bin/bash
# Delete existing pm2 process named "headlessbrowser" (ignore error if it doesn't exist)
pm2 delete headlessbrowser || true
# Build the project
npm run build
# Start the process with pm2 using "npm run start"
pm2 start npm --name headlessbrowser -- run start
