import { EMBER_NATIVE_DECORATOR_SUPPORT } from '@ember/canary-features';
import { Component } from '@ember/-internals/glimmer';
import { Object as EmberObject } from '@ember/-internals/runtime';
import { moduleFor, RenderingTestCase, strip } from 'internal-test-helpers';

import { action } from '../index';

if (EMBER_NATIVE_DECORATOR_SUPPORT) {
  moduleFor(
    '@action decorator',
    class extends RenderingTestCase {
      '@test action decorator works with ES6 class'(assert) {
        class FooComponent extends Component {
          @action
          foo() {
            assert.ok(true, 'called!');
          }
        }

        this.registerComponent('foo-bar', {
          ComponentClass: FooComponent,
          template: "<button {{action 'foo'}}>Click Me!</button>",
        });

        this.render('{{foo-bar}}');

        this.$('button').click();
      }

      '@test action decorator does not add actions to superclass'(assert) {
        class Foo extends EmberObject {
          @action
          foo() {
            // Do nothing
          }
        }

        class Bar extends Foo {
          @action
          bar() {
            assert.ok(false, 'called');
          }
        }

        let foo = Foo.create();
        let bar = Bar.create();

        assert.equal(typeof foo.actions.foo, 'function', 'foo has foo action');
        assert.equal(typeof foo.actions.bar, 'undefined', 'foo does not have bar action');

        assert.equal(typeof bar.actions.foo, 'function', 'bar has foo action');
        assert.equal(typeof bar.actions.bar, 'function', 'bar has bar action');
      }

      '@test actions are properly merged through traditional and ES6 prototype hierarchy'(assert) {
        assert.expect(4);

        let FooComponent = Component.extend({
          actions: {
            foo() {
              assert.ok(true, 'foo called!');
            },
          },
        });

        class BarComponent extends FooComponent {
          @action
          bar() {
            assert.ok(true, 'bar called!');
          }
        }

        let BazComponent = BarComponent.extend({
          actions: {
            baz() {
              assert.ok(true, 'baz called!');
            },
          },
        });

        class QuxComponent extends BazComponent {
          @action
          qux() {
            assert.ok(true, 'qux called!');
          }
        }

        this.registerComponent('qux-component', {
          ComponentClass: QuxComponent,
          template: strip`
            <button {{action 'foo'}}>Click Foo!</button>
            <button {{action 'bar'}}>Click Bar!</button>
            <button {{action 'baz'}}>Click Baz!</button>
            <button {{action 'qux'}}>Click Qux!</button>
          `,
        });

        this.render('{{qux-component}}');

        this.$('button').click();
      }

      '@test action decorator super works with native class methods'(assert) {
        class FooComponent extends Component {
          foo() {
            assert.ok(true, 'called!');
          }
        }

        class BarComponent extends FooComponent {
          @action
          foo() {
            super.foo();
          }
        }

        this.registerComponent('bar-bar', {
          ComponentClass: BarComponent,
          template: "<button {{action 'foo'}}>Click Me!</button>",
        });

        this.render('{{bar-bar}}');

        this.$('button').click();
      }

      '@test action decorator super works with traditional class methods'(assert) {
        let FooComponent = Component.extend({
          foo() {
            assert.ok(true, 'called!');
          },
        });

        class BarComponent extends FooComponent {
          @action
          foo() {
            super.foo();
          }
        }

        this.registerComponent('bar-bar', {
          ComponentClass: BarComponent,
          template: "<button {{action 'foo'}}>Click Me!</button>",
        });

        this.render('{{bar-bar}}');

        this.$('button').click();
      }

      // This test fails with _classes_ compiled in loose mode
      '@skip action decorator works with parent native class actions'(assert) {
        class FooComponent extends Component {
          @action
          foo() {
            assert.ok(true, 'called!');
          }
        }

        class BarComponent extends FooComponent {
          @action
          foo() {
            super.foo();
          }
        }

        this.registerComponent('bar-bar', {
          ComponentClass: BarComponent,
          template: "<button {{action 'foo'}}>Click Me!</button>",
        });

        this.render('{{bar-bar}}');

        this.$('button').click();
      }

      '@test action decorator binds functions'(assert) {
        class FooComponent extends Component {
          bar = 'some value';

          @action
          foo() {
            assert.equal(this.bar, 'some value', 'context bound correctly');
          }
        }

        this.registerComponent('foo-bar', {
          ComponentClass: FooComponent,
          template: '<button onclick={{this.foo}}>Click Me!</button>',
        });

        this.render('{{foo-bar}}');

        this.$('button').click();
      }

      // This test fails with _classes_ compiled in loose mode
      '@skip action decorator super works correctly when bound'(assert) {
        class FooComponent extends Component {
          bar = 'some value';

          @action
          foo() {
            assert.equal(this.bar, 'some value', 'context bound correctly');
          }
        }

        class BarComponent extends FooComponent {
          @action
          foo() {
            super.foo();
          }
        }

        this.registerComponent('bar-bar', {
          ComponentClass: BarComponent,
          template: '<button onclick={{this.foo}}>Click Me!</button>',
        });

        this.render('{{bar-bar}}');

        this.$('button').click();
      }

      '@test action decorator throws an error if applied to non-methods'() {
        expectAssertion(() => {
          class TestObject extends EmberObject {
            @action foo = 'bar';
          }

          new TestObject();
        }, /The @action decorator must be applied to methods/);
      }

      '@test action modifier warns if action decorator is not applied'() {
        class FooComponent extends Component {
          foo() {}
        }

        this.registerComponent('foo-bar', {
          ComponentClass: FooComponent,
          template: '<button {{action this.foo}}>Click Me!</button>',
        });

        return expectWarning(() => {
          this.render('{{foo-bar}}');
        }, "You passed a method, foo, to the {{action}} modifier which was not decorated with the '@action' decorator. All actions should be decorated with the '@action' decorator.");
      }

      '@test action helper warns if action decorator is not applied'() {
        class FooComponent extends Component {
          foo() {}
        }

        this.registerComponent('foo-bar', {
          ComponentClass: FooComponent,
          template: '<button {{action (action this.foo)}}>Click Me!</button>',
        });

        return expectWarning(() => {
          this.render('{{foo-bar}}');
        }, "You passed a method, foo, to the {{action}} helper which was not decorated with the '@action' decorator. All actions should be decorated with the '@action' decorator.");
      }

      '@test action modifier does not warn if passed an action'() {
        class FooComponent extends Component {
          @action
          foo() {}
        }

        this.registerComponent('foo-bar', {
          ComponentClass: FooComponent,
          template: '<button {{action (action "foo")}}>Click Me!</button>',
        });

        return expectNoWarning(() => {
          this.render('{{foo-bar}}');
        });
      }

      '@test action helper does not warn if passed an action'() {
        class FooComponent extends Component {
          @action
          foo() {}
        }

        this.registerComponent('foo-bar', {
          ComponentClass: FooComponent,
          template: '<button onclick={{action (action "foo")}}>Click Me!</button>',
        });

        return expectNoWarning(() => {
          this.render('{{foo-bar}}');
        });
      }
    }
  );
}
