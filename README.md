# Warehouse

You're the man in the box hiding out in a jewel warehouse. It's protected by the mafia but you cunningly snuck in inside a box. However you're not the only one with the same crafty plan. Try to find the others and eliminate them before they eliminate you in this point of view stealth last man standing game. You can only see the world from the vision cone out your the front of your box. Beware other boxes as they may be foes ... or just another box.

	WASD - Movement
	SHIFT - Run
	SPACE - Fire your pistol

## Usage

To install all required packages:

	$ npm install

To run the game:

	$ node app.js

Then open `http://localhost:8000` in a modern browser that supports WebGL.

If you add new modules for the client to use:

	$ npm install -g browserify
	$ browserify public/index.js -o public/bundle.js

## Credits ##

- Leigh Beattie (Programmer & Designer)
- Ricardo David Castañeda Marin (Programmer)
- Samuel Williams (Lead Programmer & Designer)
- Sam Prebble (Lead Artist & Designer)
- Richie Jehan (Artist)

The initial game code and art was made in about 30 hours of actual work as part of the Global Game Jam 2014. During that time, there were approximately 5 commits per hour.

### Dependencies ###

- [three.js](https://github.com/mrdoob/three.js) for rendering.
- [cannon.js](https://github.com/schteppe/cannon.js) for physics.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License

Released under the MIT license.

Copyright, 2014, by [Samuel G. D. Williams](http://www.codeotaku.com/samuel-williams).
Copyright, 2014, by Leigh Beattie.
Copyright, 2014, by Sam Prebble.
Copyright, 2014, by Ricardo David Castañeda Marin.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
