# The Painter’s Hand

The Painter’s Hand is an offline drawing and painting studio that turns a reference photograph into a picture you can watch being made, one stroke at a time. Upload an image, choose pencil or colour, pick a treatment inspired by Leonardo, Dürer or Rembrandt, and let the canvas gradually fill with marks.

I built it because the process of making a picture is interesting in its own right. A line finds an edge, a wash establishes a shadow, and a small highlight brings a face into focus. I wanted to build something where that process is part of the experience, and where you can explore how the finished work came together.

The studio gives you control over the palette, tools, detail, shading and how closely colours follow the reference. You can use materials such as graphite, ink, washes, dry brushes and palette knives. Each has its own digital behaviour, affecting the shape, texture and transparency of its marks. You can pause the drawing, change playback speed, replay it or jump ahead to the finished piece.

Underneath, the engine studies the reference’s colours, light, edges and local directions. It uses those observations to build a guide, proposes possible marks, and chooses actions that help the current canvas approach that guide. Each chosen stroke becomes part of an ordered drawing sequence, with its position, colour, width, pressure and opacity recorded. The visible picture is built by rendering those strokes, and the pointer follows the mark actually being drawn.

I also explored reinforcement learning: training a model to make painting decisions by trying marks and receiving feedback on their effect. The project includes experimental learned controllers alongside procedural drawing and direct stroke optimization. Testing taught me something useful: the largest trained model did not automatically make the best paintings. Direct optimization currently gives the strongest tested colour reconstruction, while the established drawing engine remains the recommended pencil route.

That distinction matters to me. The artist treatments are designed interpretations, and learning a convincing artistic eye is still an open challenge. Faces, tiny details and complex scenes can expose the system’s limits.

The whole studio runs locally in the browser. The offline edition needs no account, API key or internet connection, and uploaded references stay on your computer. You can export a PNG, an SVG, or a JSON file containing the recorded drawing instructions.

For the live demo, judges can bring a reference, change the materials, watch the marks develop and download the result. What I hope they notice is the relationship between the picture and the decisions that built it. The Painter’s Hand makes that process visible, replayable and worth exploring.
