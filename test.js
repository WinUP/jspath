var jq = require('./src/jsquery');

units = jq.analyse('/a[-1:-2]/b');

console.log(units);

console.log(jq.pick({
    a: [
        {
            b:1
        }, {
            b:2
        }
    ]
}, units));
