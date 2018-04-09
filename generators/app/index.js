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

const util = require('util');
const chalk = require('chalk');
const glob = require('glob');
const generator = require('yeoman-generator');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('../common');
const jhipsterUtils = require('generator-jhipster/generators/utils');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const JhipsterGenerator = generator.extend({});
const prompts = require('./prompts');
const JFile = require('jfile');
const fs = require('fs');
const SERVER_TEMPLATES_DIR = 'server';


util.inherits(JhipsterGenerator, BaseGenerator);


module.exports = JhipsterGenerator.extend({
    initializing: {
        init(entity) {
            if (entity) {
                this.entity = entity;
                this.entityMode = true;
            }
        },
        readConfig() {
            this.jhipsterAppConfig = this.getJhipsterAppConfig();
            if (!this.jhipsterAppConfig) {
                this.error('Can\'t read .yo-rc.json');
            }
        },
        displayLogo() {
            this.printJHipsterLogo();
            this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster entity-postgis-point')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
        },
        checkJhipster() {
            const jhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
            const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
            if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
                this.warning(`\nYour generated project used an old JHipster version (${jhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
            }
        }
    },
    prompting: {
        askForInitialize: prompts.askForInitialize
    },
    configuring: {
        prepareConfiguration() { 
            this.baseName = this.jhipsterAppConfig.baseName;
            this.packageName = this.jhipsterAppConfig.packageName;
            this.packageFolder = this.jhipsterAppConfig.packageFolder;
        }
    },
    registering() {
        try {
          this.registerModule('generator-jhipster-entity-postgis-point', 'entity', 'post', 'entity', 'Add support for entity audit and audit log page');
        } catch (err) {
          this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster post entity creation hook...\n`);
        }
    },
    writing() {
        this.template = function (source, destination) {
            fs.copyFileSync(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };
	    this.packageFolder = this.jhipsterAppConfig.packageFolder;
	    const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
	    if ( this.initializeModule ) {
            const postgisDialectFile = `${javaDir}config/PostgresDialect.java`;
            if (fs.existsSync(postgisDialectFile)) {
                console.log(chalk.green('The module is initializated.'));
            } else {
                // Copy postgis dialect
                this.template(`${SERVER_TEMPLATES_DIR}/main/java/package/config/PostgresDialect.java`, 
                `${postgisDialectFile}`);

                this.replaceContent(postgisDialectFile, 'package com;', 'package ' + this.packageName + '.config;', true);
                const applicationDev = `src/main/resources/config/application-dev.yml`;
                const applicationPro = `src/main/resources/config/application-prod.yml`;
                this.replaceContent(applicationDev, 'io.github.jhipster.domain.util.FixedPostgreSQL82Dialect', 
                'com.coderobot.campaign.config.PostgresDialect', true);
                this.replaceContent(applicationPro, 'io.github.jhipster.domain.util.FixedPostgreSQL82Dialect', 
                'com.coderobot.campaign.config.PostgresDialect', true);

                // Add dependencies to pom.xml
                jhipsterUtils.rewriteFile({
                    file: 'pom.xml',
                    needle: 'jhipster-needle-maven-add-dependency',
                    splicable: 
                    [`<dependency>
                        <groupId>org.hibernate</groupId>
                        <artifactId>hibernate-spatial</artifactId>
                        <version>5.2.4.Final</version>
                    </dependency>`]
                }, this);
                
                // Liquibase
                const postgisSqlFile = `src/main/resources/config/liquibase/postgis.sql`;
                this.template(`${SERVER_TEMPLATES_DIR}/liquibase/postgis.sql`, 
                `${postgisSqlFile}`);
                
                const postgisXmlFile = `src/main/resources/config/liquibase/changelog/postgis.xml`;
                this.template(`${SERVER_TEMPLATES_DIR}/liquibase/changelog/postgis.xml`, 
                `${postgisXmlFile}`);

                // Add changelog to master.xml
                this.replaceContent('src/main/resources/config/liquibase/master.xml', 
                    '<include file="config/liquibase/changelog/00000000000000_initial_schema.xml" relativeToChangelogFile="false"/>', 
                    '<include file="config/liquibase/changelog/00000000000000_initial_schema.xml" relativeToChangelogFile="false"/>\n'+
                    '\t<include file="config/liquibase/changelog/postgis.xml" relativeToChangelogFile="false"/>'
                    , true);


                // Add exclusion liquibase tables    
                this.replaceContent('pom.xml', 
                    '<changeLogFile>src/main/resources/config/liquibase/master.xml</changeLogFile>', 
                    '<changeLogFile>src/main/resources/config/liquibase/master.xml</changeLogFile>\n'+
                    '<diffExcludeObjects>geography_columns, geometry_columns, raster_columns, raster_overviews, spatial_ref_sys</diffExcludeObjects>'
                    , true);
            }
	    }
		
    },
    end() {
        this.log('End of entity-postgis-point generator');
    }
});