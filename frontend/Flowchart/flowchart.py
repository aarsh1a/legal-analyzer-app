from graphviz import Digraph

# Create a directed graph
dot = Digraph(comment="Sample Flowchart")

# Add nodes
dot.node("A", "Start")
dot.node("B", "Process")
dot.node("C", "End")

# Add edges
dot.edge("A", "B")
dot.edge("B", "C")

# Render to PNG
dot.render("flowchart", format="png", cleanup=True)
print("Flowchart generated: flowchart.png")
