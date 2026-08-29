# Last Bench League

An original browser pen-battle game with a classroom hub, loadout case, stakes, and a playable desk duel.

## Play locally

Open `index.html` in a modern browser. No build, dependency installation, or server is required.

## Controls

1. Choose **Practice Duel**, then choose a pen from the case.
2. Drag backwards from your pen to set direction and power.
3. Release to flick. Win two rounds by knocking the rival off the desk.

Wins claim the rival's Mint Circuit. A loss removes the selected pen from the local case. State is stored in browser local storage.

## Design notes

The project deliberately uses original names, rewards, layout, art, and copy. It does not reproduce another game's protected story, scripts, art, or level layouts.

The playable browser build has deterministic 2D arcade physics: velocity decay, collision impulse, spin, bot turns, and ring-out stakes. The portable C++17 source in `cpp/pen_physics.cpp` holds the same core simulation model and is ready to be compiled to WebAssembly with Emscripten when that toolchain is introduced. Production-quality barrel rolling will require a 3D rigid-body implementation with compound colliders and centre-of-mass offsets.
