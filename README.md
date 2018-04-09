# generator-jhipster-entity-point-field
> JHipster module to allow to create postgis point fields on JHipster Entities
## Usage

This is a [JHipster](http://jhipster.github.io/) module, that is meant to be used in a JHipster application.

The module will allow to add postgis point fields on the selected entities.

This will also add new columns to the liquibase changeset for the entities, so it is ideal to recreate the tables if you add some fields.

jhipster-entity-point-field module will register itself as a hook for Jhipster for re-create postgis fields during future entity generation as well.

### [BETA] Module
> **BETA Notice** The module is still in beta state. Expect some rough edges!
> At the moment, the generator only generates the server side configuration, you need to add the client part in your dialog template as <input type="text" [(ngModel)]="form.fieldName" /> and in your entity.model.ts as "public fieldName?: string;". This field save a wkt point, example POINT(20 -90).
I'm working in the client side part.

### Installation and Requirements

As this is a [JHipster](http://jhipster.github.io/) module, we expect you have [JHipster and its related tools already installed](http://jhipster.github.io/installation.html).

This module requires a postgresql database with postgis module installed.

This module requires Jhipster version greater than 4.0 in order to work

```bash
npm install -g generator-jhipster-entity-point-field
```

Then initialize the module on a JHipster generated application:

```bash
yo jhipster-entity-point-field
```

### Add and Remove fields on entity

```bash
yo jhipster-entity-point-field:entity
```
Then select the entity to update on the menu, select if you want to add or remove a field.

## License

Apache-2.0 ©

