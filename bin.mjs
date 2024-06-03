#!/usr/bin/env node

import {generate, handleInput} from "./index.mjs";

handleInput().then(data => generate(data));