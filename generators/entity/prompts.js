/**
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const chalk = require('chalk');
const shelljs = require('shelljs');
const _ = require('lodash');
const fs = require('fs');
const jhiCore = require('jhipster-core');

module.exports = {
    askForEntityToUpdate,
    askForUpdateEntity,
    askForFields,
    askForFieldsToRemove
};

function askForEntityToUpdate() {
    if (this.context.entityConfig)
        return;

    if (!this.context.existingEntityChoices || this.context.existingEntityChoices.length === 0)
        this.env.error(chalk.green('Aborting entity update, no entities found.'));
    const done = this.async();
    const prompts = [{
      type: 'list',
      name: 'entityToUpdate',
      message: 'Please choose the entity to update',
      choices: this.context.existingEntityChoices,
      default: 'none'
    }
    ];
    this.prompt(prompts).then((props) => {
      if (props.entityToUpdate) {
          this.context.name = props.entityToUpdate;
          this.context.entityNameCapitalized = props.entityToUpdate;
          this.context.filename = `${this.context.jhipsterConfigDirectory}/${this.context.name}.json`;
          this.data = JSON.parse(fs.readFileSync(this.context.filename,'utf8'));
          this.context.fields = this.data.postgisFields;
          if (this.context.fields && this.context.fields.length > 0) {
            this.context.fields.forEach((field) => {
                this.context.fieldNamesUnderscored.push(_.snakeCase(field.fieldName));
            });
          } else {
              this.context.fields = [];
          }
      }
      done();
    });
}

function askForUpdateEntity() {
    if (this.context.entityConfig)
    return;
	const context = this.context;
    const done = this.async();
    const prompts = [
        {
            type: 'list',
            name: 'updateEntity',
            message: 'Do you want to update this entity? This will replace the existing files for this entity, all your custom code will be overwritten',
            choices: [
                {
                    value: 'add',
                    name: 'Yes, add more fields'
                },
                {
                    value: 'remove',
                    name: 'Yes, remove fields'
                },
                {
                    value: 'none',
                    name: 'No, exit'
                }
            ],
            default: 1
        }
    ];
    this.prompt(prompts).then((props) => {
        context.updateEntity = props.updateEntity;
        if (context.updateEntity === 'none') {
            this.env.error(chalk.green('Aborting entity update, no changes were made.'));
        } 
        done();
    });
}


function askForFields() {
    if (this.context.entityConfig)
        return;
    const done = this.async();
    if (this.context.updateEntity === 'add') {
        logFieldsAndRelationships.call(this);
        askForField.call(this, done);
    } else {
        done();
    }
}


/**
 * ask question for a field creation
 */
function askForField(done) {
    if (this.context.entityConfig)
        return;
    this.log(chalk.green(`\nGenerating field #${this.context.fields.length + 1}\n`));
    const fieldNamesUnderscored = this.context.fieldNamesUnderscored;
    const prompts = [
        {
            type: 'confirm',
            name: 'fieldAdd',
            message: 'Do you want to add a field to your entity?',
            default: true
        },
        {
            when: response => response.fieldAdd === true,
            type: 'input',
            name: 'fieldName',
            validate: (input) => {
                if (!(/^([a-zA-Z0-9_]*)$/.test(input))) {
                    return 'Your field name cannot contain special characters';
                } else if (input === '') {
                    return 'Your field name cannot be empty';
                } else if (input.charAt(0) === input.charAt(0).toUpperCase()) {
                    return 'Your field name cannot start with an upper case letter';
                } else if (input === 'id' || fieldNamesUnderscored.includes(_.snakeCase(input))) {
                    return 'Your field name cannot use an already existing field name';
                } 
                else if (jhiCore.isReservedFieldName(input)) {
                    return 'Your field name cannot contain a Java or Angular reserved keyword';
                } 
                return true;
            },
            message: 'What is the name of your field?'
        },
        {
            when: response => response.fieldAdd === true,
            type: 'confirm',
            name: 'fieldValidate',
            message: 'Do you want to add validation rules to your field?',
            default: false
        },
        {
            when: response => response.fieldAdd === true && response.fieldValidate === true,
            type: 'checkbox',
            name: 'fieldValidateRules',
            message: 'Which validation rules do you want to add?',
            choices: (response) => {
                const opts = [
                    {
                        name: 'Required',
                        value: 'required'
                    }
                ];
                return opts;
            },
            default: 0
        },
        ];
        this.prompt(prompts).then((props) => {
            if (props.fieldAdd) {
                const field = {
                    fieldName: props.fieldName,
                    fieldKey: _.snakeCase(props.fieldName),
                    fieldType: 'postgis',
                    fieldValidateRules: props.fieldValidateRules,
                    
                };    
                fieldNamesUnderscored.push(_.snakeCase(props.fieldName));
                this.context.fields.push(field);
            }
            logFieldsAndRelationships.call(this);
            if (props.fieldAdd) {
                askForField.call(this, done);
            } else {
                done();
            }
        });
}

function askForFieldsToRemove() {
    if (this.context.entityConfig)
        return;
    const context = this.context;
    // prompt only if data is imported from a file
    if (context.updateEntity !== 'remove' || !context.fields || context.fields.length === 0) {
        return;
    }
    const done = this.async();

    const prompts = [
        {
            type: 'checkbox',
            name: 'fieldsToRemove',
            message: 'Please choose the fields you want to remove',
            choices: (response) => {
                const ops = [];
                context.fields.forEach((field) => {
                    ops.push({ name: field.fieldName, value: field.fieldName});
                });
                return ops;
            },
            default: 0
        },
        {
            when: response => response.fieldsToRemove.length !== 0,
            type: 'confirm',
            name: 'confirmRemove',
            message: 'Are you sure to remove these fields?',
            default: true
        }
    ];
    this.prompt(prompts).then((props) => {
        if (props.confirmRemove) {
            this.log(chalk.red(`\nRemoving fields: ${props.fieldsToRemove}\n`));
            for (let i = context.fields.length - 1; i >= 0; i -= 1) {
                const field = context.fields[i];
                if (props.fieldsToRemove.filter(val => val === field.fieldName).length > 0) {
                    context.fields.splice(i, 1);
                }
            }
        }
        done();
    });
}


function logFieldsAndRelationships() {
    if (!this.context.fields)
        return;
    if (this.context.fields.length > 0) {
        this.log(chalk.red(chalk.white('\n================= ') + this.context.entityNameCapitalized + chalk.white(' =================')));
    }
    if (this.context.fields.length > 0) {
        this.log(chalk.white('Fields'));
        this.context.fields.forEach((field) => {
            const validationDetails = [];
            const fieldValidate = _.isArray(field.fieldValidateRules) && field.fieldValidateRules.length >= 1;
            if (fieldValidate === true) {
                if (field.fieldValidateRules.includes('required')) {
                    validationDetails.push('required');
                }
            }
            this.log(chalk.red(field.fieldName) + chalk.white(` (${field.fieldType}${field.fieldTypeBlobContent ? ` ${field.fieldTypeBlobContent}` : ''}) `) + chalk.cyan(validationDetails.join(' ')));
        });
    }
}