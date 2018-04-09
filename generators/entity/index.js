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
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const fs = require('fs');
const _ = require('lodash');
const packagejs = require('../../package.json');
const prompts = require('./prompts');
const ucfirst = require('ucfirst');
const SUPPORTED_VALIDATION_RULES = jhipsterConstants.SUPPORTED_VALIDATION_RULES;

module.exports = class extends BaseGenerator {
  get initializing() {
    return {
      readConfig() {
        this.context = {};
        this.context.fields = [];
        this.context.fieldNamesUnderscored = [];
        this.context.useConfigurationFile = false;
        this.context.entityConfig = this.options.entityConfig;
        this.context.jhipsterConfigDirectory = '.jhipster';
        this.jhipsterAppConfig = this.getJhipsterAppConfig();
        this.jhAppConfig = this.getJhipsterAppConfig();
        if (!this.jhAppConfig) {
          this.error('Can\'t read .yo-rc.json');
        }
      },
      setSource() {
      },
      checkDBType() {
        if (this.jhAppConfig.databaseType !== 'sql' || this.jhAppConfig.prodDatabaseType !== 'postgresql' ||
            this.jhAppConfig.devDatabaseType !== 'postgresql' ) {
            this.env.error(`${chalk.red.bold('ERROR!')} This sub generator should be used only from Postgresql database...\n`);
        }
      },
      getEntitityNames() {
        const existingEntities = [];
        const existingEntityChoices = [];
        let existingEntityNames = [];
        try {
          existingEntityNames = fs.readdirSync('.jhipster');
        } catch (e) {
          this.env.error(`${chalk.red.bold('ERROR!')} Could not read entities, you might not have generated any entities yet entities will not be updated...\n`);
        }
        existingEntityNames.forEach((entry) => {
          if (entry.indexOf('.json') !== -1) {
            const entityName = entry.replace('.json', '');
            existingEntities.push(entityName);
            existingEntityChoices.push({
              name: entityName,
              value: entityName
            });
          }
        });
        this.context.existingEntities = existingEntities;
        this.context.existingEntityChoices = existingEntityChoices;
      },
      displayLogo() {
        if (this.context.entityConfig) {  
          this.log(`\n${chalk.bold.green('Re-generating postgis fields')}`);
          return;
        }
        this.printJHipsterLogo();
        this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster entity-postgis-point')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
      },
      validate() {
        if (this.abort) {
          this.env.error(`${chalk.red.bold('ERROR!')} This sub generator should be used only from Postgresql database...\n`);
        }
      },
    };
  }
  get prompting() {
    return {
      askForEntityToUpdate: prompts.askForEntityToUpdate,
      askForUpdateEntity: prompts.askForUpdateEntity,
      askForFields: prompts.askForFields,
      askForFieldsToRemove: prompts.askForFieldsToRemove
    }
  }
  get configuring() {
    return {
      validateFile() {
          if (this.context.useConfigurationFile) {
              return;
          }
          const entityName = this.context.name;
          // Validate entity json field content
          if (!this.context.fields) 
            return;
          this.context.fields.forEach((field) => {
              if (_.isUndefined(field.fieldName)) {
                  this.error(chalk.red(`fieldName is missing in .jhipster/${entityName}.json for field ${JSON.stringify(field, null, 4)}`));
              }

              if (_.isUndefined(field.fieldType)) {
                  this.error(chalk.red(`fieldType is missing in .jhipster/${entityName}.json for field ${JSON.stringify(field, null, 4)}`));
              }

              if (!_.isUndefined(field.fieldValidateRules)) {
                  if (!_.isArray(field.fieldValidateRules)) {
                      this.error(chalk.red(`fieldValidateRules is not an array in .jhipster/${entityName}.json for field ${JSON.stringify(field, null, 4)}`));
                  }
                  field.fieldValidateRules.forEach((fieldValidateRule) => {
                      if (!_.includes(SUPPORTED_VALIDATION_RULES, fieldValidateRule)) {
                          this.error(chalk.red(`fieldValidateRules contains unknown validation rule ${fieldValidateRule} in .jhipster/${entityName}.json for field ${JSON.stringify(field, null, 4)} [supported validation rules ${SUPPORTED_VALIDATION_RULES}]`));
                      }
                  });
              }
          });
        },
        writeEntityJson() {
          const context = this.context;
          if (this.context.entityConfig) {
            this.context.name = this.context.entityConfig.entityNameCapitalized;
            this.context.entityNameCapitalized = this.context.name;
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
          this.data = JSON.parse(fs.readFileSync(this.context.filename,'utf8'));
          this.data.postgisFields = context.fields;
          this.fs.writeJSON(this.context.filename, this.data, null, 4);
        },
      }
  }
  get writing() {
    return {
        write() {
          this.packageFolder = this.jhipsterAppConfig.packageFolder;
          const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
          const entityFile = `${javaDir}domain/${this.context.name}.java`;
          // Entity remove
          this.replaceContent(entityFile,'import com.vividsolutions.jts.geom.GeometryFactory;\n', '', true);
          this.replaceContent(entityFile,'import com.vividsolutions.jts.geom.Point;\n','', true);
          this.replaceContent(entityFile,'import com.vividsolutions.jts.io.ParseException;\n','', true);
          this.replaceContent(entityFile,'import com.vividsolutions.jts.io.WKTReader;\n','', true);
          this.replaceContent(entityFile, 
          'import java.io.Serializable;', 
          'import java.io.Serializable;\n'+
          'import com.vividsolutions.jts.geom.GeometryFactory;\n'+
          'import com.vividsolutions.jts.geom.Point;\n'+
          'import com.vividsolutions.jts.io.ParseException;\n'+
          'import com.vividsolutions.jts.io.WKTReader;'
          , true);
          this.replaceContent(entityFile,
          /\/\/ jhipster-needle-postgis-field-start.*\n.*\n.*\n.*\/\/ jhipster-needle-postgis-field-end\n/mg,
          '',
          true);
          this.replaceContent(entityFile,
            /\/\/ jhipster-needle-postgis-functions-start.*\n.*\n.*\n.*\n.*\n.*\n.*\/\/ jhipster-needle-postgis-functions-end\n/mg,
            '',
            true);
          this.replaceContent(entityFile,
            /\/\/ jhipster-needle-postgis-functions-start.*\n.*\n.*\/\/ jhipster-needle-postgis-functions-end\n/mg,
            '',
            true);
          this.replaceContent(entityFile,
            /^\s*$/mg,
            ''
          );
          this.replaceContent(entityFile,
            /^\s*$/mg,
            ''
          );
          // Liquibase remove
          const liquibaseFolder = 'src/main/resources/config/liquibase/changelog';
          let liquibaseFiles = fs.readdirSync(liquibaseFolder);
          let liquibaseFileName = null;
          liquibaseFiles.forEach((liquibaseFile) => {
            if (liquibaseFile.indexOf(`_added_entity_${this.context.name}.xml`)!== -1) {
              liquibaseFileName = liquibaseFile;
            }
          });
          if (liquibaseFileName) {
            this.replaceContent(liquibaseFolder + '/' + liquibaseFileName,
              /<!-- jhipster-needle-postgis-fields-start.*\n.*\n.*postgis-fields-end -->\n/mg,
              '',
              true);
              this.replaceContent(liquibaseFolder + '/' + liquibaseFileName,
                /^\s*$/mg,
                ''
              );
          }
          



          if(this.data.postgisFields && this.data.postgisFields.length > 0) {
            this.data.postgisFields.forEach((field) => {
              // Add column
              let fieldName = field.fieldName + 'Point';
              jhipsterUtils.rewriteFile({
                file: entityFile,
                needle: 'jhipster-needle-entity-add-field',
                splicable: 
                [`// jhipster-needle-postgis-field-start - don't remove\n\t@Column(columnDefinition = "geometry(Point,4326)")\n\tprivate Point ${fieldName};\n\t// jhipster-needle-postgis-field-end\n`]
              }, this);
              // Add getters
              jhipsterUtils.rewriteFile({
                file: entityFile,
                needle: 'jhipster-needle-entity-add-getters-setters',
                splicable: 
                [`// jhipster-needle-postgis-functions-start - don't remove\n\tpublic String get`+ucfirst(fieldName)+`() { return ${fieldName} != null ? ${fieldName}.toText() : null; }\n\t// jhipster-needle-postgis-functions-end\n`]
              }, this);
              // Add setters
              jhipsterUtils.rewriteFile({
                file: entityFile,
                needle: 'jhipster-needle-entity-add-getters-setters',
                splicable: 
                [`// jhipster-needle-postgis-functions-start - don't remove\n\tpublic String get`+ucfirst(fieldName)+`() { return ${fieldName} != null ? ${fieldName}.toText() : null; }\n\t// jhipster-needle-postgis-functions-end\n`]
              }, this);

              jhipsterUtils.rewriteFile({
                file: entityFile,
                needle: 'jhipster-needle-entity-add-getters-setters',
                splicable: 
                [`// jhipster-needle-postgis-functions-start - don't remove\n\tpublic void set`+ucfirst(fieldName)+`(String location) {\n\t\tif(!location.isEmpty())\n\t\ttry { ${fieldName} = ((Point) (new WKTReader(new GeometryFactory())).read(location)); ${fieldName}.setSRID(4326); }\n\t\tcatch (ParseException e) {}\n\t}\n\t// jhipster-needle-postgis-functions-end\n`]
              }, this);

              if (liquibaseFileName) {
                jhipsterUtils.rewriteFile({
                  file: liquibaseFolder + '/' + liquibaseFileName,
                  needle: 'jhipster-needle-liquibase-add-column',
                  splicable: 
                  [`<!-- jhipster-needle-postgis-fields-start -->`
                  +`\n\t\t\t<column name="${field.fieldKey}_point" type="geometry(Point,4326)"/>`
                  +`\n\t\t\t<!-- jhipster-needle-postgis-fields-end -->\n`]
                }, this);
              }


              console.log(liquibaseFileName);
            
            });
          } 
        }
    };
  }
  end() {
    //this.log(`\n${chalk.bold.green('Test please')}`);
  }
};