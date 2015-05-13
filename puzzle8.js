'use strict'

window.onload = function() {
	var puzzleForm = document.getElementById('puzzleForm');
	var onSubmitPuzzleForm = function(e) {
		e.preventDefault();
		document.getElementById('result').innerHTML = '';

		const ANSWER = {
			1: [0, 0], 2: [0, 1], 3: [0, 2],
			4: [1, 0], 5: [1, 1], 6: [1, 2],
			7: [2, 0], 8: [2, 1], "*": [2, 2]
		};
		const MAX_TRIAL = 1000;

		var puzzleFormatter = function(puzzleData) {
			var puzzle = {};
			var rows   = puzzleData.split('\n').map(function(row) {
				return row.trim();
			});

			if (rows.length !== 3) {
				throw Error('DataFormatError');
			}

			for (var i = 0; i < rows.length; i++) {
				var data = rows[i].split(' ');

				if (data.length !== 3) {
					throw Error('DataFormatError');
				}

				for (var j = 0; j < data.length; j++) {
					if (data[j] in ANSWER) {
						puzzle[data[j]] = [i, j];
					} else {
						throw Error('DataFormatError');
					}
				}
			}

			puzzle.cost = 0;
			puzzle.name = 'S';

			return puzzle;
		}

		var nextPuzzles = (function() {
			var nameCounter = 0;

			return function(puzzle) {
				var swap = function(puzzle, newSpace) {
					var nextPuzzle = JSON.parse(JSON.stringify(puzzle));

					nextPuzzle.cost += 1;
					nextPuzzle.name = 'N' + nameCounter;
					nameCounter++;

					for (var key in ANSWER) {
						if (nextPuzzle[key][0] === newSpace[0] &&
								nextPuzzle[key][1] === newSpace[1]) {
							nextPuzzle[key] = JSON.parse(JSON.stringify(nextPuzzle['*']));
						nextPuzzle['*'] = newSpace;
						return nextPuzzle;
						}
					}
				}
				var result = [];
				var space  = puzzle['*'];

				if (0 < space[0]) {
					result.push(swap(puzzle, [space[0] - 1, space[1]]));
				}
				if (space[0] < 2) {
					result.push(swap(puzzle, [space[0] + 1, space[1]]));
				}
				if (0 < space[1]) {
					result.push(swap(puzzle, [space[0], space[1] - 1]));
				}
				if (space[1] < 2) {
					result.push(swap(puzzle, [space[0], space[1] + 1]));
				}

				return result;
			};
		})();

		var evaluationFunctions = {
			incorrectTiles: function(puzzle) {
				var result = 0;

				for (var key in ANSWER) {
					if (key !== '*' && (ANSWER[key][0] !== puzzle[key][0] || ANSWER[key][1] !== puzzle[key][1])) {
						result += 1;
					}
				}

				return result;
			},

			manhattanDistance: function(puzzle) {
				var result = 0;

				for (var key in ANSWER) {
					if (key !== '*') {
						for (var i in puzzle[key]) {
							result += Math.abs(ANSWER[key][i] - puzzle[key][i]);
						}
					}
				}

				return result;
			}
		};

		var displayData = function(puzzle, algorithm, n, next, wait, fx, cutoff) {
			var append = function(parent, className, child) {
				var index         = parent.indexOf('class="' + className + '"');
				var startTagIndex = parent.indexOf('<', index);
				var endTagIndex   = parent.indexOf('</', index);
				var correct       = 1;

				if (startTagIndex === endTagIndex) {
					return parent.slice(0, endTagIndex) + child + parent.slice(endTagIndex);
				}

				while (correct > 0) {
					if (0 < startTagIndex && startTagIndex <= endTagIndex) {
						correct++;
						startTagIndex = parent.indexOf('<', ++startTagIndex);
					} else {
						correct    -= 2;
						if (correct > 0) {
							endTagIndex = parent.indexOf('</', ++endTagIndex);
						}
					}
				}

				return parent.slice(0, endTagIndex) + child + parent.slice(endTagIndex);
			}
			var createPuzzleTable = function(node) {
				var template = document.getElementById('nodeTemplate').innerHTML;

				for(var key in ANSWER) {
					template = append(template, 'data' + node[key][0] + node[key][1], key);
				}

				return append(template, 'name', 'Name: ' + node.name);
			}
			var result       = document.getElementById('result');
			var algoTemplate = document.getElementById('' + algorithm + 'Template').innerText;
			var puzzle       = createPuzzleTable(puzzle);
			var next         = next.map(function(node) {
				return createPuzzleTable(node);
			});

			algoTemplate = append(algoTemplate, 'current', puzzle);
			algoTemplate = append(algoTemplate, 'try', 'Try: ' + n);
			algoTemplate = append(algoTemplate, 'wait', 'Unexpanded Nodes: ' + JSON.stringify(wait));

			algoTemplate = append(algoTemplate, 'fx', 'Value of f(x): ' + fx);
			next.forEach(function(node) {
				algoTemplate = append(algoTemplate, 'next', node);
			});

			if (algorithm === 'IDAstar') {
				algoTemplate = append(algoTemplate, 'cutoff', 'Cutoff: ' + cutoff);
			}

			result.innerHTML += algoTemplate;
		}

		var solver = function(puzzle, algorithm, evaluate) {
			var result      = [];
			var waitNodes   = [puzzle];
			var selectNode  = function(nodes) {
				var sumOfCosts = nodes.map(function(node) {
					return node.cost + evaluate(node);
				});
				var min   = Math.min.apply(null, sumOfCosts);
				var index = sumOfCosts.indexOf(min);
				return nodes.splice(index, 1)[0];
			}

			if (algorithm === 'Astar') {
				for (var i = 1; i < MAX_TRIAL; i++) {
					var node = selectNode(waitNodes);

					node.wait = JSON.parse(JSON.stringify(waitNodes));
					result.push(node);

					var next = nextPuzzles(node);

					displayData(node,
											algorithm,
											i,
											next,
											waitNodes.map(function(node) { return node.name; }),
											evaluate(node) + node.cost,
											null);

					if (evaluate(node) === 0) {
						return result;
					}

					Array.prototype.push.apply(waitNodes, next);
				}

				throw Error('CantSolve');
			} else if (algorithm === 'IDAstar') {
				var trial = 1;
				for (var cutoff = evaluate(puzzle); cutoff < MAX_TRIAL / 10; cutoff++) {
					while (waitNodes.length !== 0) {
						var node = selectNode(waitNodes);

						node.wait = JSON.parse(JSON.stringify(waitNodes));
						node.cutoff = cutoff;
						result.push(node);

						var next = nextPuzzles(node);

						displayData(node,
												algorithm,
												trial,
												next,
												waitNodes.map(function(node) { return node.name; }),
												evaluate(node) + node.cost,
												node.cutoff);

						if (evaluate(node) === 0) {
							return result;
						}

						next.forEach(function(nd) {
							if (nd.cost < cutoff) {
								waitNodes.push(nd);
							}
						});

						trial++;
					}
					waitNodes = [puzzle];
				}
			}
		}

		try {
			var puzzleData = document.getElementById('puzzle').value.trim();
			var algoType   = document.getElementById('algo').value;
			var evalType   = document.getElementById('eval').value;
			var puzzle     = puzzleFormatter(puzzleData);
			var evaluate   = evaluationFunctions[evalType];
			solver(puzzle, algoType, evaluate);
		} catch (e) {
			console.log(e, e.message);
		}
	}

	puzzleForm.addEventListener('submit', onSubmitPuzzleForm);
}
