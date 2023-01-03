/*
1. allows real number in COEFFICIENT, and in EXPONENT only when it equals to an Integer. eg. 2.3a+4.b (because 4.===4) is ok, but 2.3a+4.1b is not because only 0 and positive integers are allowed in the exponent position for polynomial
2. allows short-hand eg 2a3begin1end2, this is equivalent to 2*a*a*a*begin*end*end
3. allows any number of unary operators '+' and '-' in the prefix position of any operand , eg +---+-(3.) is ok, but +-*3 is ill-formed
4. allows any number of parenthesis pairs '( ... )' , eg ((((3))+2)*.4) should be allowed
5. be able to output two versions of result, one is reduced to its simplest form, another one is resolved using the evalvars/evalints that are supplied as function parameters, eg for input expression '(a+b)^2,  'a*a+b*b+2*a*b' is expected if basicCalulatorIV('(a+b)^2', ['a','b'], [2,3], false) is invoked, 25 is expected if  basicCalulator('(a+b)^2', ['a','b'], [2,3], true) is invoked (note: the last parameter is true by default, assuming the function signature is basicCalculatorIV(expression, evalvars, evalints, toResolve=true)
6. operator '**' and '^' should be treated exactly the same, eg '5^3' and '5**3' should yield the same result
7. follow the same output requirements as specified in Leetcode problem statement, pay special attention to the ordering of terms, eg a*a*a*a+a*a*b*b+a*b*a*a is correct output format, but a*a*a*a+a*b*a*a+a*a*b*b is not (wrong alphabetical order even though all terms has the same degree)
8. come up with some test cases using the above examples, plus some of your own, to test the program after you finish the draft
9. be patient, allow yourself sufficient time, frustration and bugs are part of the normal process. Keep in mind that this is not an easy challenge. But trust me, you will learn a lot and hopefully commit this to a long term memory. It will give you a taste of what a real world problem that a programmer has to handle in real life.

*/
class Var {
	constructor(base, exp) {
		this.base = base;
		this.exp = exp;
	}
	varEqual(that) {
		return this.base === that.base && this.exp == that.exp ? true : false;
	}
}
//let a = new Term(5, [new Var('a',2)],2), b= new Term(1,[new Var('b',1)],1), c= new Term(1,[new Var('a',4)],4);
class Term {
	// e.g. 5a^2 * b^4  <=>new Term(5, [new Var('a', 2),new Var('b', 4)], 6)<=> new Term(5, [new Var('b', 4)],4).mult(new Term(1,[new Var('a',2)],2))
	constructor(coef, val = [], degree) {
		this.coef = coef;
		this.val = val;
		this.val.sort();
		this.degree = degree;
	}
	valEqual(that) {
		if (this.val.length !== that.val.length) return false;
		if (!this.val && !that.val) return true;
		else if (!this.val || !that.val) return false;
		for (let i = 0; i < this.val.length; ++i)
			if (!this.val[i].varEqual(that.val[i])) return false; //only work for sorted arrays
		return true;
	}
	add(that) {
		//[1,2,3]!==[1,2,3]
		return this.valEqual(that)
			? new Term(this.coef + that.coef, this.val, this.degree)
			: new Expr([this, that]);
	}
	mult(that) {
		let res = new Term(this.coef * that.coef, [], 0);
		function find(a, b, diffonly = false) {
			for (let v1 of a.val) {
				for (let v2 of b.val) {
					if (v1.base === v2.base && !diffonly) {
						res.val.push(new Var(v1.base, v1.exp + v2.exp));
						res.degree += v1.exp + v2.exp;
						break;
					}
					if (v1.base !== v2.base) {
						res.val.push(v1);
						res.degree += v1.exp;
					}
				}
			}
		}
		find(this, that);
		find(that, this, true);
		return res;
	}
}
class Expr {
	constructor(terms = []) {
		this.terms = terms;
		this.terms.sort((a, b) => {
			if (a.degree > b.degree) return 1;
			else if (a.degree < b.degree) return -1;
			if (a.base > b.base) return 1;
			return -1;
		});
	}
	add(that) {
		// '1a+2b+3b' + '1a+2b' merge all terms and apply Terms.prototype.add()
		let res = new Expr();
		for (let i1 = 0; i1 < this.terms.length; ++i1) {
			for (let i2 = 0; i2 < that.terms.length; ++i2) {
				if (this.terms[i1].valEqual(that.terms[i2])) {
					this.terms[i1] = this.terms[i1].add(that.terms[i2]);
					that.terms.splice(i2--, 1);
				}
			}
		}
		const get = (x) => {
			for (let i of x.terms) res.terms.push(i);
		};
		get(this);
		get(that);
		return res;

		//if (termsEqual(this.terms, that.terms))
		//	return this.terms.map((x) => x.coef * 2);
	}
	eval(evalvars, evalints) {
		let map = {};
		for (let i = 0; i < evalvars.length; ++i) map[evalvars[i]] = evalints[i];
	}
}
let parReplacement;
class ParExpr {
	constructor(parNum, parStr) {
		this.parNum = parNum;
		this.parStr = parStr;
		this.repl = parReplacement; //treat () as varible
	}
	evalPar(evalvars, evalints) {
		this.parStr = this.parStr.slice(1, this.parStr.length - 1);
		return basicCalculatorIV(this.parStr, evalvars, evalints, true);
	}
}
const handlePar = (expression, evalvars, evalints) => {
	let peak = 0;
	/*parReplacement = /[a-z]+/g.test(expression)
		? 'p' + expression.match(/[a-z]+/g).join('')
		: 'p';
	*/
	parReplacement = 'parrep';
	let temp = [];
	let startIndex = 0;
	let inPar = 0;
	for (let i = 0; i < expression.length; ++i) {
		if (!/[()]/.test(expression[i])) continue;
		if (expression[i] === '(') {
			if (inPar++ === 0) [startIndex, inPar] = [i, 2];
			if (inPar > peak) peak = inPar;
			continue;
		}
		if (--inPar === 1) {
			temp.push(expression.substring(startIndex, i + 1));
			[startIndex, inPar] = [i + 1, 0];
		}
	}

	let parArr = [];
	console.log(`temp: ${temp}`);
	console.log(`peak: ${peak}`);
	/*if (peak === 2) {
		for (let t of temp) {
			//t = t.replaceAll(/[()]/g, '');
			return [
				expression,
				[parse(t.slice(1, t.length - 1), evalvars, evalints, parArr, true)],
			];
		}
	} else {*/
	for (let i = 0; i < temp.length; ++i) {
		parArr.push(new ParExpr(i, temp[i]));
		expression = expression.replace(
			parArr[i].parStr,
			'1' + parArr[i].repl + '1'
		);
	}
	return [expression, parArr];
	//}
};
var basicCalculatorIV = function (
	expression,
	evalvars = [],
	evalints = [],
	par = false
) {
	console.log(`Orginal: ${expression}`);

	while (/(?:--|\+\+)/g.test(expression) || /(?:\+-|-\+)/g.test(expression)) {
		expression = expression.replaceAll(/(?:\+-|-\+)/g, '-');
		expression = expression.replaceAll(/(?:--|\+\+)/g, '+');
	}
	expression = expression.replaceAll(/(?<![+*(])-(?!=[()])/g, '+-');
	expression = expression.replaceAll(/\s/g, '');
	if (/\d+[.](?![1-9])/g.test(expression)) {
		//4. -> 4  4.0 -> 4
		if (/\d+[.](?!\d+)/g.test(expression))
			for (let i of expression.match(/\d+[.](?!\d+)/g))
				expression = expression.replace(i, i.replaceAll(/\./g, ''));
		if (/\d+[.]0+/g.test(expression))
			for (let i of expression.match(/\d+[.]0+/g))
				expression = expression.replace(i, i.replaceAll(/\.0+/g, ''));
	}

	const repl = () => {
		let temp = [];
		for (let i of expression.matchAll(/(?<=[a-z]+)(?:\*{2}|\^)/g)) temp.push(i);
		temp.reverse();
		for (let i of temp)
			expression =
				i[0] === '**'
					? expression.slice(0, i.index) + expression.slice(i.index + 2)
					: expression.slice(0, i.index) + expression.slice(i.index + 1);
	};
	//string.prototype.replace does not recognize difference between '1.1' and '.1' although the match found was '.1', it will also replace '.1' in '1.1'
	const repl1 = () => {
		let temp = [];
		for (let i of expression.matchAll(/(?<!\d+)[.]\d+/g)) temp.push(i);
		temp.reverse();
		for (let i of temp)
			expression =
				expression.slice(0, i.index) + '0' + expression.slice(i.index);
	};
	const repl2 = () => {
		let temp = [];
		for (let i of expression.matchAll(/(?<var>[a-z]+)(?!\d+)/g)) temp.push(i);
		temp.reverse();
		for (let i of temp)
			expression =
				expression.slice(0, i.index + i.groups.var.length) +
				'1' +
				expression.slice(i.index + i.groups.var.length);
	};
	const repl3 = () => {
		let temp = [];
		for (let i of expression.matchAll(/(?<!\d+)(?<var>[a-z]+)/g)) temp.push(i);
		temp.reverse();
		for (let i of temp)
			expression =
				expression.slice(0, i.index) + '1' + expression.slice(i.index);
	};
	if (/(?<=[a-z]+)(?:\*{2}|\^)/g.test(expression)) repl();
	if (/(?<!\d+)[.]\d+/g.test(expression)) repl1();
	if (/[a-z]+(?!\d+)/g.test(expression)) repl2();
	if (/(?<!\d+)[a-z]+/g.test(expression)) repl3();
	let parData;
	let parArr = [];
	let parKey = [];
	if (/[()]/g.test(expression)) {
		parData = handlePar(expression, evalvars, evalints);
		[expression, parArr] = [parData[0], parData[1]];
		for (let i of parArr) {
			parKey.push(i.evalPar(evalvars, evalints)); //i.evalPar() should return [nums,expr] where expr is right after toTerm() and before toAns()
			console.log(`parKey ${parKey}`);
		}
	}
	//if (parArr.length === 1) if (typeof parArr[0] === 'number') return parArr[0];
	console.log(`expression: ${expression}`);
	//console.log(`parArr: ${parArr}`);
	if (!/[a-z()]/.test(expression))
		return parse(expression, evalvars, evalints, parArr, parKey, false, true);
	return parse(expression, evalvars, evalints, parArr, parKey, par);
};
//basicCalculatorIV('1+(2+3)+2*((1+3))+a+b+c-d');
//basicCalculatorIV('1+2+1a5b5*5+-5+1a2b6+5c1+-5a1*2+5.1a1');
//console.log(`answer: ${basicCalculatorIV('((1+2))')}`);
//console.log(`answer: ${basicCalculatorIV('1.1a 5+2.b-.1a')}`);
console.log(
	//`answer: ${basicCalculatorIV('1.a9.+.0b9+.1+0.-a**9+j^2+a1*b**2')}`
	//`answer: ${basicCalculatorIV('1a1+1b+2b1a1', ['a'], [100])}`
	//`answer: ${basicCalculatorIV('1.1a 5+2.b-.1ab+0a9+0b')}`
	//`answer: ${basicCalculatorIV('')}`
	basicCalculatorIV('e - 8 + temperature - pressure')
);
function parse(
	str,
	evalvars,
	evalints,
	parArr,
	parKey,
	par = false,
	numOnly = false,
	nums = 0
) {
	/*if (parKey.length) {
		//2parrep -parrep *parrep +parrep
		let rep = new RegExp(parReplacement, 'g');
		for (let p = 0; p < parKey.length; ++p) {
			let temp = [];
			if (rep.test(str)) {
				if (/(?<=\d+)[a-z]+/g.test(str)) {
					for (let i of str.matchAll(/(?<=\d+)(?<rep>[a-z]+)/g)) {
						temp.push(i);
					}
					temp.reverse();
					for(let m of temp){
						if(m.groups.rep!==rep)continue;
						str=
					}
				}
			}
		}
	}*/
	if (evalints.length) {
		// do not confuse: 1end1 1e1
		//eg evalvars =['a'] evalints =[2]
		//cases:
		//		/\d+[a-z]+\d+(?=[a-z])/g; //1a1b1 -> 1*2**1*1b1
		//		/\d+[a-z]+\d+(?=\+)/g; //1a1 -> 1*2**1
		//		/\d+\*[a-z]+\d+(?=\*)/g; //1a1*1b1 or 1a1*1-> 1*2**1*1

		for (let v = 0; v < evalvars.length; ++v) {
			let temp = [];
			let rv = new RegExp(evalvars[v], 'g');
			if (rv.test(str)) {
				if (/\d+[a-z]+\d+(?=[a-z]+)/g.test(str)) {
					for (let i of str.matchAll(
						/(?<=\d+)(?<var>[a-z]+)(?<exp>\d+)(?=[a-z]+)/g
					))
						temp.push(i);
					temp.reverse();
					for (let m of temp) {
						if (m.groups.var !== evalvars[v]) continue;

						str =
							str.slice(0, m.index) +
							'*' +
							evalints[v] +
							'**' +
							str.slice(m.index + 1, m.index + 1 + m.groups.exp.length) +
							'*1' +
							str.slice(m.index + 1 + m.groups.exp.length);
					}
					temp = [];
				}
				if (/(?<=\d+)[a-z]+(?:\d+$|\d+(?=\+))/g.test(str)) {
					for (let i of str.matchAll(
						/(?<=\d+)(?<var>[a-z]+)(?:\d+$|\d+(?=\+))/g
					))
						temp.push(i);
					temp.reverse();
					for (let m of temp) {
						if (m.groups.var !== evalvars[v]) continue;
						console.log(m.index);
						str =
							str.slice(0, m.index) +
							'*' +
							evalints[v] +
							'**' +
							str.slice(m.index + 1);
					}
					temp = [];
				}
				if (/(?<=\d+)[a-z]+\d+(?=\*)/g.test(str)) {
					for (let i of str.matchAll(/(?<=\d+)(?<var>[a-z]+)\d+(?=\*)/g))
						temp.push(i);
					temp.reverse();
					for (let m of temp) {
						if (m.groups.var !== evalvars[v]) continue;
						console.log(m.index);
						str =
							str.slice(0, m.index) +
							'*' +
							evalints[v] +
							'**' +
							str.slice(m.index + 1);
					}
				}
			}
		}
	}

	console.log(`str: ${str}`);

	const access = (regex = [], s) => {
		let res = [];
		for (let i of regex) for (let k of s.matchAll(i)) res.push(k);
		return res; //res[n][0] nth found match, base: res[n].groups['base'], exp: res[n].groups['exp'], res.index = starting index
	};

	//replace numbers containing exp
	if (/\d+(?=(?:\*{2}|\^))/g.test(str)) {
		let numExp = access(
			[
				/(?<base>\.d+)(?:\*\*|\^)(?<exp>\d+)/g,
				/(?<base>\d+)(?:\*\*|\^)(?<exp>\d+)/g,
				/(?<base>\d+)\.(?:\*\*|\^)(?<exp>\d+)/g,
				/(?<base>\d+\.\d+)(?:\*\*|\^)(?<exp>\d+)/g,
			],
			str
		); //float^int(.1^1) or float^int(1.1^2) or (int^int(1.^2) or int^int(1^2)

		for (let n of numExp)
			str = str.replace(n[0], n.groups.base ** n.groups.exp);
	}
	//let nums = 0; //stand-alone constants, NOT include terms with ()
	let arr = str.split(/(?<!\*)\+/g); //do not have to worry about () since they were already replaced
	console.log(arr);
	for (let i = 0; i < arr.length; ++i) {
		//0.4 4.0 0.0 0
		if (/(?<!\d+)0(?!\.)/g.test(arr[i]) || /0\.0+/g.test(arr[i]))
			arr.splice(i--, 1);
		if (!/[a-z]+/g.test(arr[i])) {
			if (Number.parseFloat(arr[i])) {
				if (!/\*/g.test(arr[i])) nums += Number.parseFloat(arr.splice(i--, 1));
				//Number.parseInt('3*2')=3   NaN!=NaN... Number.parseInt('1a')=1
				else {
					nums += arr[i].split('*').reduce((a, b) => a * b);
					arr.splice(i--, 1);
				}
			}
		}
	}
	if (numOnly) return nums;
	console.log(`nums: ${nums}`);
	/*let vari = [
		//add int. case eg a^3. = a^3
		str.match(/(?<base>[a-z]+)\*\*(?<exp>\d+)/g),
		str.match(/(?<base>[a-z]+)(?<exp>\d+)/g),
		str.match(/(?<base>[a-z]+)\^(?<exp>\d+)/g),
	];*/
	console.log(`arr: ${arr}`);

	let coeff = new Array(arr.length);
	for (let i = 0; i < arr.length; ++i) {
		//seperate coeff and turn arr to varible only
		let m1 = 1,
			m2 = 1;
		if (/(?:^\d+(?!\.)|^\d+\.(?!\d+)|^\d+\.\d+)/g.test(arr[i])) {
			// 1 or 1. or 1.1
			// 4.4a 4.4*1.2a   4.4(1+2) 4.4
			m1 = arr[i].match(/(?:^\d+(?!\.)|^\d+\.(?!\d+)|^\d+\.\d+)/g)[0];
			coeff[i] = m1;
		} else if (/(?:-\d+(?!\.)|-\d+\.(?!\d+)|-\d+\.\d+)/g.test(arr[i])) {
			m2 = arr[i].match(/(?:-\d+(?!\.)|-\d+\.(?!\d+)|-\d+\.\d+)/g)[0];
			coeff[i] = m2;
		}
		if (/(?:\*\d+(?!\.)|\*\d+\.(?!\d+)|\*\d+\.\d+)/g.test(arr[i])) {
			//  coeff: 1a or -1a or a1*1
			for (let c of arr[i].match(
				/(?:(?<=\*)\d+(?!\.)|(?<=\*)\d+\.(?!\d+)|(?<=\*)\d+\.\d+)/g
			)) {
				coeff[i] = !coeff[i] ? c : coeff[i] * c;
				arr[i] = arr[i].replace('*' + c, '');
			}
		}
		if (m1 !== 1) arr[i] = arr[i].replace(m1, '');
		if (m2 !== 1) arr[i] = arr[i].replace(m2, '');
		coeff = coeff.map((x) => Number.parseFloat(x));
	}

	console.log(`coeff: ${coeff}`);
	console.log(`var: ${arr}`);

	/*let vari = access([
		/(?<base>[a-z]+)\*\*(?<exp>\d+)/g,
		/(?<base>[a-z]+)(?<exp>\d+)/g,
		/(?<base>[a-z]+)\^(?<exp>\d+)/g,
	]); //3 notations for exponent
	console.log(vari);*/
	/*let variNote = [
		/(?<base>[a-z]+)\*{2}(?<exp>\d+)/g,
		/(?<base>[a-z]+)(?<exp>\d+)/g,
		/(?<base>[a-z]+)\^(?<exp>\d+)/g,
	];*/

	let base = new Array(arr.length);
	let exponent = new Array(arr.length);
	for (let i = 0; i < arr.length; ++i) {
		base[i] = arr[i].match(/[a-z]+/g);
		exponent[i] = arr[i].match(/\d+/g);
		exponent[i] = exponent[i].map((x) => Number.parseFloat(x));
	}

	let toTerm = () => {
		let res = new Array(arr.length);
		let sum = new Expr();
		let initVar, cur;
		for (let i = 0; i < res.length; ++i) {
			initVar = [new Var(base[i][0], exponent[i][0])];
			cur = new Term(coeff[i], initVar, exponent[i][0]);
			for (let k = 1; k < base[i].length; ++k) {
				cur = cur.mult(
					new Term(1, [new Var(base[i][k], exponent[i][k])], exponent[i][k])
				);
			}
			//res[i] = cur;
			sum = i === 0 ? new Expr([cur]) : sum.add(new Expr([cur]));
		}
		return sum;
	};
	if (par) [nums, toTerm()];
	let res;
	res = toTerm();

	console.log(res);
	const toAns = () => {
		let ans = [];
		let temp;
		for (let t of res.terms) {
			temp = [];
			temp.push(t.coef.toString());
			for (let v of t.val) {
				for (let e = 0; e < v.exp; ++e) {
					temp.push('*' + v.base.toString());
				}
			}
			ans.push(temp.join(''));
		}
		return ans;
	};
	res = toAns();
	res.push(nums.toString());
	return res;
}

/*
console.log(
	new Expr([
		new Term(1, [new Var('a', 2)], 2),
		new Term(2, [new Var('b', 3)], 3),
	]).add(
		new Expr([
			new Term(3, [new Var('a', 2)], 2),
			new Term(5, [new Var('b', 2)], 2),
		])
	).terms
);
*/
/*
console.log(
	new Term(1, [new Var('a', 2)], 2).add(
		new Term(2, [new Var('a', 3), new Var('a', 2)], 5)
	)
);*/
//console.log(
//	new Term(1, [new Var('e', 0)], 0).mult(new Term(2, [new Var('e', 2)], 2))
//);

/*
    '5a**4b**5c5 + 5ab + 7ac+ 9e + 7a**7 + 2*3 + 2**3 + a^3 + 2^3 + 3^9 + -3**2'
    str = '5a**4b**5c5+5ab+7ac+9e+7a**7+2*3+2**3+a^3+2^3+3^9+-3**2', exp = [str.matchAll(/(?<base>[a-z\d+])\*\*(?<exp>d+(?!\.))/dg),str.matchAll(/(?<base>[a-z])(?<exp>\d+(?!\.))/dg),str.matchAll(/(?<base>[a-z])\^(?<exp>\d+(?!\.))/dg)], temp=[], found=[], indices=[];
    for(let k of exp){
    for(const i of k)found.push(i);
    for(const i of found)indices.push(i.indices);
    }

*/
