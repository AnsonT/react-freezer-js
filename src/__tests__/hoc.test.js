import React from 'react'
import sinon from 'sinon'
import test from 'blue-tape'
import Freezer from 'freezer-js'
import ReactDOMServer from 'react-dom/server'
import { cool, warmUp, isFridge } from '../'

function setup () {
  const TestComp = props => {
    const { children } = props
    if (children) return children
    if (props.dispatch) props.dispatch()
    return <i>{JSON.stringify(props).replace(/\"/g, '')}</i>
  }
  const fridge = new Freezer({ui: {theFlag: true}}, {mutable: true})
  return {
    TestComp, fridge,
  }
}

test('Cooled component', t => {
  const { fridge, TestComp } = setup()
  const CooledComp = cool(TestComp, fridge)
  t.equal(CooledComp.displayName, 'CooledTestComp', 'has a derived name')
  t.deepEqual(CooledComp.childContextTypes, {
    fridge: isFridge,
    dispatch: React.PropTypes.func.isRequired,
  }, 'has some child context types')
  t.end()
})

test('Warmed up component', t => {
  const { TestComp } = setup()
  const WarmedUpComp = warmUp(TestComp, [])
  t.equal(WarmedUpComp.displayName, 'WarmedUpTestComp', 'has a derived name')
  t.deepEqual(WarmedUpComp.contextTypes, {
    fridge: isFridge,
    dispatch: React.PropTypes.func.isRequired,
  }, 'has some context types')
  t.end()
})

test('Rendered warmed up component', t => {
  const { fridge, TestComp } = setup()
  const WarmedUpComp = warmUp(TestComp, [['flag', 'ui', 'theFlag']])
  const CooledApp = cool(TestComp, fridge)
  const renderStuff = () => {
    return ReactDOMServer.renderToStaticMarkup(
      <CooledApp><WarmedUpComp a="some" /></CooledApp>
    )
  }
  const rndrd = renderStuff()
  t.equal(rndrd, '<i>{a:some,flag:true}</i>', 'gets fresh props from the fridge')
  t.end()
})

test('Warmed up component', t => {
  const { fridge, TestComp } = setup()
  const spy = sinon.spy()
  fridge.on('SOME_ACTION', spy)
  const WarmedUpComp = warmUp(TestComp, [
    ['flag', 'ui', 'theFlag'],
    ['@dispatch', 'SOME_ACTION', 'two', 'args'],
  ])
  const CooledApp = cool(TestComp, fridge)
  const renderStuff = () => {
    return ReactDOMServer.renderToStaticMarkup(
      <CooledApp><WarmedUpComp a="some" /></CooledApp>
    )
  }
  renderStuff()
  t.true(spy.calledWith('two', 'args'), 'can use bound trigger from the fridge')
  t.true(spy.calledOnce)
  t.end()
})
