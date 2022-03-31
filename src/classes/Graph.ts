type Node = string;

interface Edge {
	source: Node;
	target: Node;
}

interface Serialized {
	nodes: Node[];
	links: Edge[];
}

class GraphCycleError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, GraphCycleError.prototype);
	}
}

export class Graph {
	private adjacencyList: Record<Node, Node[]>;

	public constructor() {
		this.adjacencyList = {};
	}

	private adjacent(node: Node): Node[] {
		return this.adjacencyList[node] || [];
	}

	public addNode(node: Node) {
		this.adjacencyList[node] = this.adjacent(node);
		return this;
	}

	public removeNode(node: Node) {
		for (const key in this.adjacencyList) {
			for (const r of this.adjacencyList[key]) {
				if (r === node) {
					this.removeEdge(r, key);
				}
			}
		}

		for (const u in this.adjacencyList) {
			for (const v in this.adjacencyList[u]) {
				if (v === node) {
					this.removeEdge(u, v);
				}
			}
		}

		delete this.adjacencyList[node];

		return this;
	}

	public nodes() {
		return Object.keys(this.adjacencyList);
	}

	public addEdge(source: Node, target: Node) {
		this.addNode(source);
		this.addNode(target);
		this.adjacent(source).push(target);
		return this;
	}

	public removeEdge(u: Node, v: Node) {
		if (this.adjacencyList[u])
			this.adjacencyList[u] = this.adjacent(u).filter((_v) => _v !== v);

		return this;
	}

	public hasEdge(source: Node, target: Node) {
		return this.adjacent(source).includes(target);
	}

	public depthFirstSearch(
		sourceNodes?: Node[],
		includeSourceNodes: boolean = true,
		errorCycle: string | false = 'Cycle found',
	): Node[] {
		if (!sourceNodes) sourceNodes = this.nodes();

		if (typeof includeSourceNodes !== 'boolean') includeSourceNodes = true;

		const visited_nodes: Record<Node, boolean> = {};
		const visiting_nodes: Record<Node, boolean> = {};
		const node_list: Node[] = [];

		const dfs = (node: Node) => {
			if (visiting_nodes[node] && errorCycle)
				throw new GraphCycleError(errorCycle);

			if (!visited_nodes[node]) {
				visited_nodes[node] = true;
				visiting_nodes[node] = true;
				this.adjacent(node).forEach(dfs);
				visiting_nodes[node] = false;
				node_list.push(node);
			}
		};

		if (includeSourceNodes) {
			sourceNodes.forEach(dfs);
		} else {
			for (const node of sourceNodes) {
				visited_nodes[node] = true;
				this.adjacent(node).forEach(dfs);
			}
		}

		return node_list;
	}

	public hasCycle(): boolean {
		try {
			this.depthFirstSearch(undefined, true);

			return false;
		} catch (error) {
			if (
				error instanceof GraphCycleError &&
				error.name === 'GraphCycleError'
			) {
				return true;
			} else {
				throw error;
			}
		}
	}

	public topologicalSort(
		sourceNodes?: Node[],
		includeSourceNodes: boolean = true,
	) {
		return this.depthFirstSearch(sourceNodes, includeSourceNodes, false);
	}

	public toJSON(): Serialized {
		const serialized: Serialized = {
			nodes: this.nodes(),
			links: [],
		};

		for (const source of serialized.nodes) {
			for (const target of this.adjacent(source)) {
				serialized.links.push({
					source,
					target,
				});
			}
		}

		return serialized;
	}
}
