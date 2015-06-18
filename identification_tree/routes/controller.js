var properties = [];
var samples    = [];

/*
	 properties = [ { name: 'Hair', candidates: [ 'blonde', 'brown', 'red' ] },
	 { name: 'Height', candidates: [ 'average', 'tall', 'short' ] },
	 { name: 'Weight', candidates: [ 'light', 'average', 'heavy' ] },
	 { name: 'Lotion', candidates: [ 'yes', 'no' ] },
	 { name: 'Result', candidates: [ 'sunburned', 'none' ] } ]

	 samples = [ { sampleName: 'Sarah',
Hair: 'blonde',
Height: 'average',
Weight: 'light',
Lotion: 'no',
Result: 'sunburned' },
{ sampleName: 'Dana',
Hair: 'blonde',
Height: 'tall',
Weight: 'average',
Lotion: 'yes',
Result: 'none' },
{ sampleName: 'Alex',
Hair: 'brown',
Height: 'short',
Weight: 'average',
Lotion: 'yes',
Result: 'none' },
{ sampleName: 'Annie',
Hair: 'blonde',
Height: 'short',
Weight: 'average',
Lotion: 'no',
Result: 'sunburned' },
{ sampleName: 'Emily',
Hair: 'red',
Height: 'average',
Weight: 'heavy',
Lotion: 'no',
Result: 'sunburned' },
{ sampleName: 'Pete',
Hair: 'brown',
Height: 'tall',
Weight: 'heavy',
Lotion: 'no',
Result: 'none' },
{ sampleName: 'John',
Hair: 'brown',
Height: 'average',
Weight: 'heavy',
Lotion: 'no',
Result: 'none' },
{ sampleName: 'Katie',
Hair: 'blonde',
Height: 'short',
Weight: 'light',
Lotion: 'yes',
Result: 'none' } ]
*/

exports.index = function(req, res, next) {
	console.log(JSON.stringify(samples, null, 2));
	console.log(JSON.stringify(properties, null, 2));
	res.render('index', { 
		properties: properties,
		samples: samples
	});
};

exports.property = function(req, res, next) {

	var name       = req.body.propertyName;
	var candidates = req.body.propertyCandidates.replace(/\r\n/g, '\n').split('\n');

	if (name && candidates.length > 1) {
		properties.push({
			name      : name,
			candidates: candidates
		});
	}
	res.redirect('/');
}

exports.sample = function(req, res, next) {
	if (properties.length > 0 && req.body.sampleName) {
		samples.push(req.body);
	}
	res.redirect('/');
}

exports.create = function(req, res, next) {
  var resultIndex = req.query.result;
	var result      = properties[resultIndex];

	var initialData = function() {
		var props = JSON.parse(JSON.stringify(properties));
		props.splice(resultIndex, 1);
		return {
			samples     : JSON.parse(JSON.stringify(samples)),
			properties  : props,
			classifiedBy: '',
			children    : [ ],
			isLeaf      : true
		};
	}

	var classify = function(data, propIndex) {
		var result = [];
		var nextSamples = {};
		var props = JSON.parse(JSON.stringify(data.properties));
		var prop  = props.splice(propIndex, 1)[0];
		var children = [];

		if (data.samples.length === 0) {
			return;
		}

		prop.candidates.forEach(function(c) {
			nextSamples[c] = [];
		});

		for (i = 0; i < data.samples.length; i++) {
			nextSamples[data.samples[i][prop.name]].push(data.samples[i]);
		}

		for (var key in nextSamples) {
			var s = {
				samples     : nextSamples[key],
				properties  : props,
				classifiedBy: prop.name + ':' + key,
				classname   : key,
				sampleNames : nextSamples[key].map(function(s) { return s.sampleName; }),
				children    : [],
				isLeaf      : true
			};

			result.push(s);
		}

		return result;
	}

	var disorder = function(data) {
		var d = 0;

		for (var i = 0; i < data.samples.length; i++) {
			if (data.samples[i][result.name] === result.candidates[0]) {
				d += 1;
			}
		}

		d = (d === 0) ? 0 : (- (d / data.samples.length) * Math.log(d / data.samples.length));

		if (d !== 0) {
			data.isLeaf = false;
		}

		return d;
	}

	var averageDisorder = function(nexts) {
		var d = 0;

		nexts.forEach(function(next) {
			d += disorder(next);
		})

		return d / nexts.length;
	}

	var selectNext = function(data) {
		var selected, minAve;

		for (var i = 0; i < data.properties.length; i++) {
			var nexts = classify(data, i);
			var ave   = averageDisorder(nexts);

			selected = selected || nexts;
			minAve = minAve || ave;

			if (ave < minAve) {
				selected = nexts;
				minAve = ave;
			}
		}

		return selected;
	}

	var createTree = function() {
		var i = 0;
		var init = initialData();
		var database = [init];
		disorder(init);

		while (database[i] !== undefined) {
			if (database[i].isLeaf === false) {
				var next = selectNext(database[i]);

				for (var j = 0; j < next.length; j++) {
					database[i].children.push(database.length);
					database.push(next[j]);
				}
			}
			i++;
		}

		return database;
	}

	var displayTree = function(node, tree) {
		
		var parent = '<a href="#">' + (node.classifiedBy || 'Samples') + '</a>';
		var children = node.children.map(function(i) {
			return displayTree(tree[i], tree);
		}).join('');

		if (node.samples.length > 0) {
			if (children === '') {
				children = node.samples.map(function(s) {
					return s.sampleName;
				}).join('<br>');
				children = '<a href="#">' + result.name + ' = ' + node.samples[0][result.name] + '<br>' + children + '</a>'
			}
			children = '<ul>' + children + '</ul>'
		}

		return '<li>' + parent + children + '</li>';
	}

	var tree = createTree();
	var dom = displayTree(tree[0], tree);

	res.render('create', {
		properties: properties,
		samples: samples,
		dom: dom
	});
}

exports.clear = function(req, res, next) {
	properties = [];
	samples    = [];
	res.redirect('/');
}
