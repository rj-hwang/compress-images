@echo 'Starting compress images'
@echo off
node do-compress.js 
@echo 'Compress images completed'
@echo 'Console will be close after [10] seconds...'
@echo off 
ping 127.0.0.1 -n 10 > nul
