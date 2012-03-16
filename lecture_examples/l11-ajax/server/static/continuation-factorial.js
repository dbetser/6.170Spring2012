// from http://matt.might.net/articles/by-example-continuation-passing-style/

function fact(n) {
  if (n == 0)
    return 1 ;
  else
    return n * fact(n-1) ;
}


function contFact(n,ret) {
  if (n == 0)
    ret(1) ;
  else
    contFact(n-1, function (t0) {
     ret(n * t0) }) ;
}

if (console) {
    console.log(fact(5));
    fact (5, function (n) { 
	console.log(n);
    });
}