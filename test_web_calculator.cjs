// Node.js 기본 도구만으로 HTML 안의 실제 계산 로직을 테스트합니다.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const Calculator = vm.runInNewContext(script + '\nCalculator;');
function run(keys) {
  const calculator = new Calculator();
  for (const key of keys) calculator.press(key);
  return calculator;
}

for (const [keys, expected] of [
  ['12+3=', '15'], ['3-8=', '-5'], ['6×7=', '42'], ['9÷4=', '2.25'],
  ['0.1+0.2=', '0.3'], ['2+3×4=', '20'], ['9+-2=', '7'],
  ['2+3=×4=', '20'], ['2+3=7', '7'], ['1..5+2=', '3.5'],
  ['8+C2+3=', '5'], ['8÷0=C2+3=', '5'], ['8÷0=2+3=', '5'],
  ['2+=', '2'], ['2+3==', '5'], ['.5+0002=', '2.5'],
]) {
  test(`${keys} → ${expected}`, () => assert.equal(run(keys).display, expected));
}
test('0과 소수 0으로 나누면 한국어 오류', () => {
  for (const keys of ['8÷0=', '0÷0=', '8÷0.0=']) {
    assert.equal(run(keys).display, '오류');
    assert.match(run(keys).error, /0으로 나눌 수 없습니다/);
  }
});
test('부호 변경과 마지막 숫자 지우기', () => {
  assert.equal(run(['1', '2', 'backspace', '+', '3', '=']).display, '4');
  assert.equal(run(['5', 'sign', '+', '2', '=']).display, '-3');
  assert.equal(run(['5', '+', 'sign', '2', '=']).display, '3');
});
test('입력 길이 제한과 계산 범위 초과', () => {
  assert.equal(run('123456789012345').display, '123456789012');
  const calculator = run('999999999999');
  for (let i = 0; i < 30; i++) {
    calculator.press('×');
    for (const digit of '999999999999') calculator.press(digit);
    calculator.press('=');
    if (calculator.error) break;
  }
  assert.match(calculator.error, /계산 범위/);
});
