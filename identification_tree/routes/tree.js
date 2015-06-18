properties = [ {
	name      : String,
	candidates: [ String ]
} ]
samples = [ {
	sampleName: String
	prop_n    : String
	...
} ]
data = {
	samples     : samples,
	properties  : Boolean,
	classifiedBy: [ Integer ],
	children    : [ prop ],
	isLeaf      : prop
}
database = [ data ]

var initialData = function() {
	return {
		samples     : JSON.parse(JSON.stringify(samples)),
		properties  : JSON.parse(JSON.stringify(properties)),
		classifiedBy: { },
		children    : [ ],
		isLeaf      : true;
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
			classifiedBy: prop,
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

	database = [initialData()];

	while (database[i] !== undefined) {
		var next = selectNext(database[i]);

		for (var j = 0; j < next.length; j++) {
			database.push(next[j]);
			database[i].children.push(j);

			if (next[j].samples.length > 0) {
				database[i].isLeaf = false;
			}
		}
		i++;
	}
}
