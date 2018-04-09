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
const jhiCore = require('jhipster-core');

module.exports = {
    askForInitialize,
    askForUpdateEntity
};

function askForInitialize() {
	const context = this.context;
    const done = this.async();
    if (!this.entityMode) {
        const prompts = [
            {
                type: 'list',
                name: 'initializeModule',
                message: 'Do you want to initialize postgis point module?',
                choices: [
                    {
                        value: true,
                        name: 'Yes'
                    },
                    {
                        value: false,
                        name: 'No, continue'
                    }
                ],
                default: 1
            }
        ];
        this.prompt(prompts).then((props) => {
            this.initializeModule = props.initializeModule;
            //if (this.initializeModule === 'none') {
            //    this.env.error(chalk.green('Aborting postgis point module initialization, no changes were made.'));
            //}
            done();
        });
    } else {
        done();
    }
}

function askForUpdateEntity() {
	const context = this.context;
    const done = this.async();
    const prompts = [
        {
            type: 'list',
            name: 'updateEntity',
            message: 'Do you want to update point fields? This will replace the existing files for this entity, all your custom code will be overwritten',
            choices: [
                {
                    value: 'regenerate',
                    name: 'Yes, re generate the entity'
                },
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
        this.updateEntity = props.updateEntity;
        if (this.updateEntity === 'none') {
            this.env.error(chalk.green('Aborting entity update, no changes were made.'));
        }
        done();
    });
}



/**
 * ask question for a field creation
 */
function askForField(done) {
    const context = this.context;
    this.log(chalk.green(`\nGenerating field #${context.fields.length + 1}\n`));
    const skipServer = context.skipServer;
    const prodDatabaseType = context.prodDatabaseType;
    const databaseType = context.databaseType;
    const fieldNamesUnderscored = context.fieldNamesUnderscored;
    const skipCheckLengthOfIdentifier = context.skipCheckLengthOfIdentifier;
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
                } else if (!skipServer && jhiCore.isReservedFieldName(input)) {
                    return 'Your field name cannot contain a Java or Angular reserved keyword';
                } else if (prodDatabaseType === 'oracle' && input.length > 30 && !skipCheckLengthOfIdentifier) {
                    return 'The field name cannot be of more than 30 characters';
                }
                return true;
            },
            message: 'What is the name of your field?'
        },
        {
            when: response => response.fieldAdd === true && (skipServer || ['sql', 'mongodb', 'couchbase'].includes(databaseType)),
            type: 'list',
            name: 'fieldType',
            message: 'What is the type of your field?',
            choices: [
                {
                    value: 'String',
                    name: 'String'
                },
                {
                    value: 'Integer',
                    name: 'Integer'
                },
                {
                    value: 'Long',
                    name: 'Long'
                },
                {
                    value: 'Float',
                    name: 'Float'
                },
                {
                    value: 'Double',
                    name: 'Double'
                },
                {
                    value: 'BigDecimal',
                    name: 'BigDecimal'
                },
                {
                    value: 'LocalDate',
                    name: 'LocalDate'
                },
                {
                    value: 'Instant',
                    name: 'Instant'
                },
                {
                    value: 'ZonedDateTime',
                    name: 'ZonedDateTime'
                },
                {
                    value: 'Boolean',
                    name: 'Boolean'
                },
                {
                    value: 'enum',
                    name: 'Enumeration (Java enum type)'
                },
                {
                    value: 'byte[]',
                    name: '[BETA] Blob'
                }
            ],
            default: 0
        },
        {
            when: (response) => {
                if (response.fieldType === 'enum') {
                    response.fieldIsEnum = true;
                    return true;
                }
                response.fieldIsEnum = false;
                return false;
            },
            type: 'input',
            name: 'fieldType',
            validate: (input) => {
                if (input === '') {
                    return 'Your class name cannot be empty.';
                } else if (jhiCore.isReservedKeyword(input, 'JAVA')) {
                    return 'Your enum name cannot contain a Java reserved keyword';
                }
                if (!/^[A-Za-z0-9_]*$/.test(input)) {
                    return 'Your enum name cannot contain special characters (allowed characters: A-Z, a-z, 0-9 and _)';
                }
                if (context.enums.includes(input)) {
                    context.existingEnum = true;
                } else {
                    context.enums.push(input);
                }
                return true;
            },
            message: 'What is the class name of your enumeration?'
        },
        {
            when: response => response.fieldIsEnum,
            type: 'input',
            name: 'fieldValues',
            validate: (input) => {
                if (input === '' && context.existingEnum) {
                    context.existingEnum = false;
                    return true;
                }
                if (input === '') {
                    return 'You must specify values for your enumeration';
                }
                // Commas allowed so that user can input a list of values split by commas.
                if (!/^[A-Za-z0-9_,]+$/.test(input)) {
                    return 'Enum values cannot contain special characters (allowed characters: A-Z, a-z, 0-9 and _)';
                }
                const enums = input.replace(/\s/g, '').split(',');
                if (_.uniq(enums).length !== enums.length) {
                    return `Enum values cannot contain duplicates (typed values: ${input})`;
                }
                for (let i = 0; i < enums.length; i++) {
                    if (/^[0-9].*/.test(enums[i])) {
                        return `Enum value "${enums[i]}" cannot start with a number`;
                    }
                    if (enums[i] === '') {
                        return 'Enum value cannot be empty (did you accidentally type "," twice in a row?)';
                    }
                }

                return true;
            },
            message: (answers) => {
                if (!context.existingEnum) {
                    return 'What are the values of your enumeration (separated by comma, no spaces)?';
                }
                return 'What are the new values of your enumeration (separated by comma, no spaces)?\nThe new values will replace the old ones.\nNothing will be done if there are no new values.';
            }
        },
        {
            when: response => response.fieldAdd === true && databaseType === 'cassandra',
            type: 'list',
            name: 'fieldType',
            message: 'What is the type of your field?',
            choices: [
                {
                    value: 'UUID',
                    name: 'UUID'
                },
                {
                    value: 'String',
                    name: 'String'
                },
                {
                    value: 'Integer',
                    name: 'Integer'
                },
                {
                    value: 'Long',
                    name: 'Long'
                },
                {
                    value: 'Float',
                    name: 'Float'
                },
                {
                    value: 'Double',
                    name: 'Double'
                },
                {
                    value: 'BigDecimal',
                    name: 'BigDecimal'
                },
                {
                    value: 'LocalDate',
                    name: 'LocalDate (Warning: only compatible with Cassandra v3)'
                },
                {
                    value: 'Instant',
                    name: 'Instant'
                },
                {
                    value: 'ZonedDateTime',
                    name: 'ZonedDateTime'
                },
                {
                    value: 'Boolean',
                    name: 'Boolean'
                },
                {
                    value: 'ByteBuffer',
                    name: '[BETA] blob'
                }
            ],
            default: 0
        },
        {
            when: response => response.fieldAdd === true && response.fieldType === 'byte[]',
            type: 'list',
            name: 'fieldTypeBlobContent',
            message: 'What is the content of the Blob field?',
            choices: [
                {
                    value: 'image',
                    name: 'An image'
                },
                {
                    value: 'any',
                    name: 'A binary file'
                },
                {
                    value: 'text',
                    name: 'A CLOB (Text field)'
                }
            ],
            default: 0
        },
        {
            when: response => response.fieldAdd === true && response.fieldType === 'ByteBuffer',
            type: 'list',
            name: 'fieldTypeBlobContent',
            message: 'What is the content of the Blob field?',
            choices: [
                {
                    value: 'image',
                    name: 'An image'
                },
                {
                    value: 'any',
                    name: 'A binary file'
                }
            ],
            default: 0
        },
        {
            when: response => response.fieldAdd === true && response.fieldType !== 'byte[]' && response.fieldType !== 'ByteBuffer',
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
                // Default rules applicable for fieldType 'LocalDate', 'Instant',
                // 'ZonedDateTime', 'UUID', 'Boolean', 'ByteBuffer' and 'Enum'
                const opts = [
                    {
                        name: 'Required',
                        value: 'required'
                    }/* ,
                    {
                        name: 'Unique',
                        value: 'unique'
                    } */
                ];
                if (response.fieldType === 'String' || response.fieldTypeBlobContent === 'text') {
                    opts.push(
                        {
                            name: 'Minimum length',
                            value: 'minlength'
                        },
                        {
                            name: 'Maximum length',
                            value: 'maxlength'
                        },
                        {
                            name: 'Regular expression pattern',
                            value: 'pattern'
                        }
                    );
                } else if (['Integer', 'Long', 'Float', 'Double', 'BigDecimal'].includes(response.fieldType)) {
                    opts.push(
                        {
                            name: 'Minimum',
                            value: 'min'
                        },
                        {
                            name: 'Maximum',
                            value: 'max'
                        }
                    );
                } else if (response.fieldType === 'byte[]' && response.fieldTypeBlobContent !== 'text') {
                    opts.push(
                        {
                            name: 'Minimum byte size',
                            value: 'minbytes'
                        },
                        {
                            name: 'Maximum byte size',
                            value: 'maxbytes'
                        }
                    );
                }
                return opts;
            },
            default: 0
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('minlength'),
            type: 'input',
            name: 'fieldValidateRulesMinlength',
            validate: input => (this.isNumber(input) ? true : 'Minimum length must be a positive number'),
            message: 'What is the minimum length of your field?',
            default: 0
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('maxlength'),
            type: 'input',
            name: 'fieldValidateRulesMaxlength',
            validate: input => (this.isNumber(input) ? true : 'Maximum length must be a positive number'),
            message: 'What is the maximum length of your field?',
            default: 20
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('min'),
            type: 'input',
            name: 'fieldValidateRulesMin',
            message: 'What is the minimum of your field?',
            validate: (input, response) => {
                if (['Float', 'Double', 'BigDecimal'].includes(response.fieldType)) {
                    return this.isSignedDecimalNumber(input) ? true : 'Minimum must be a decimal number';
                }
                return this.isSignedNumber(input) ? true : 'Minimum must be a number';
            },
            default: 0
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('max'),
            type: 'input',
            name: 'fieldValidateRulesMax',
            message: 'What is the maximum of your field?',
            validate: (input, response) => {
                if (['Float', 'Double', 'BigDecimal'].includes(response.fieldType)) {
                    return this.isSignedDecimalNumber(input) ? true : 'Maximum must be a decimal number';
                }
                return this.isSignedNumber(input) ? true : 'Maximum must be a number';
            },
            default: 100
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('minbytes') &&
                    response.fieldType === 'byte[]' &&
                    response.fieldTypeBlobContent !== 'text',
            type: 'input',
            name: 'fieldValidateRulesMinbytes',
            message: 'What is the minimum byte size of your field?',
            validate: input => (this.isNumber(input) ? true : 'Minimum byte size must be a positive number'),
            default: 0
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('maxbytes') &&
                    response.fieldType === 'byte[]' &&
                    response.fieldTypeBlobContent !== 'text',
            type: 'input',
            name: 'fieldValidateRulesMaxbytes',
            message: 'What is the maximum byte size of your field?',
            validate: input => (this.isNumber(input) ? true : 'Maximum byte size must be a positive number'),
            default: 5000000
        },
        {
            when: response => response.fieldAdd === true &&
                    response.fieldValidate === true &&
                    response.fieldValidateRules.includes('pattern'),
            type: 'input',
            name: 'fieldValidateRulesPattern',
            message: 'What is the regular expression pattern you want to apply on your field?',
            default: '^[a-zA-Z0-9]*$'
        }
    ];
    this.prompt(prompts).then((props) => {
        if (props.fieldAdd) {
            if (props.fieldIsEnum) {
                props.fieldType = _.upperFirst(props.fieldType);
                props.fieldValues = props.fieldValues.toUpperCase();
            }

            const field = {
                fieldName: props.fieldName,
                fieldType: props.fieldType,
                fieldTypeBlobContent: props.fieldTypeBlobContent,
                fieldValues: props.fieldValues,
                fieldValidateRules: props.fieldValidateRules,
                fieldValidateRulesMinlength: props.fieldValidateRulesMinlength,
                fieldValidateRulesMaxlength: props.fieldValidateRulesMaxlength,
                fieldValidateRulesPattern: props.fieldValidateRulesPattern,
                fieldValidateRulesMin: props.fieldValidateRulesMin,
                fieldValidateRulesMax: props.fieldValidateRulesMax,
                fieldValidateRulesMinbytes: props.fieldValidateRulesMinbytes,
                fieldValidateRulesMaxbytes: props.fieldValidateRulesMaxbytes
            };

            fieldNamesUnderscored.push(_.snakeCase(props.fieldName));
            context.fields.push(field);
        }
        logFieldsAndRelationships.call(this);
        if (props.fieldAdd) {
            askForField.call(this, done);
        } else {
            done();
        }
    });
}
