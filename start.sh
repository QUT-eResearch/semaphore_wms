#!/bin/bash

forever start -m 7 -l ~/logs/wms.log -o ~/logs/wms.out.log -e ~/logs/wms.err.log -a wms/app.js