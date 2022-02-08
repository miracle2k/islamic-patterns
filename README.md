# Two Mathematicians

A generative art project published on Artblocks: 
https://www.artblocks.io/project/242


## Technical Details

We use two approaches for generating a variety of patterns.

The first is based on reconstructing the geometry of specific, existing patterns. and identifying
symetrical points which can be translated within the coordinate system to modify the inherent shapes,
essentially creating a range of visually distinct patterns derived from the same base pattern. 
The book  "Islamic Geometric Patterns" by Eric Broug was a fantastic reference for this.

The second is based on the "Polygons in Contract" technique proposed by Ernest Hanbury Hankin,
and described by Craig Kaplan in the paper "Computer Generated Islamic Star Patterns"
(https://www.mi.sanu.ac.rs/vismath/kaplan/index.html).

Here, a base layout of polygons (squares or hexagons) is used to fill the canvas with construction
lines. We then draw lines from the center of each side of the polygon, until they intersect with
each other. Depending on the base layout and the angle chosen, a different pattern will emerge.
