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

const BaseGenerator = require('generator-jhipster/generators/generator-base');

module.exports = class extends BaseGenerator {

    importUUID(file, importNeedle = 'import java.util.List;') {
        this.replaceContent(file, importNeedle, `${importNeedle}\nimport java.util.UUID;`);
    }

    longToUUID(file) {
        this.importUUID(file, 'import java.util.Objects;');
        this.replaceContent(file, 'Long', 'UUID', true);
    }

    convertIDtoUUIDForColumn(file, importNeedle, columnName) {
        this.replaceContent(file, '@GeneratedValue.*', '@GeneratedValue', true);
        this.replaceContent(file, '.*@SequenceGenerator.*\n', '', true);
        this.longToUUID(file);
    }
};
