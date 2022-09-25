const md5 = require('md5');

const { sortObj } = require('./utils');
const { flattenArrayOfObjectsAndGetKeys } = require('./tabulation');

exports.toObjects = (rows) => {
    if (!rows || rows.length <= 1) return [];
    const keys = rows[0];
    return rows.slice(1).map((row) => {
        const obj = {};
        keys.forEach((key, i) => {
            if (typeof row[i] === 'object') {
                throw new Error('TRANSFORMING ERROR - Cannot convert nested objects to rows');
            }
            obj[key] = row[i];
        });
        return obj;
    });
};

exports.toRows = (objects) => {
    if (!objects || objects.length === 0) return [];
    const header = Object.keys(objects[0]);
    const values = objects.map((object) => Object.values(object));
    return [header, ...values];
};

const makeUniqueRows = (oldObjects, newObjects, field, equality) => {
    const countHash = (row) => md5(Object.values(row).join(''));
    const rowIntoKey = (row) => {
        if (field) return row[field];
        if (equality) return countHash(row);
        throw new Error('Nor field or equality was provided to filterUniqueRows function');
    };
    if (!field && !equality) return oldObjects.concat(newObjects);
    console.log("not concating")
    const tempObj = {};
    oldObjects.concat(newObjects).forEach((row) => {
        const key = rowIntoKey(row);
        if (!tempObj[key]) {
            tempObj[key] = row;
        }
    });
    const filteredRows = Object.values(tempObj).filter((row) => !!row);
    return filteredRows;
};

// export to test
exports.makeUniqueRows = makeUniqueRows;

// works only if all objects in one array have the same keys
exports.updateRowsObjects = ({
    oldObjects = [],
    newObjects = [],
    deduplicateByField,
    deduplicateByEquality,
    transformFunction,
    columnsOrder,
    keepSheetColumnOrder,
}) => {
    if (keepSheetColumnOrder && oldObjects[0]) {
        // eslint-disable-next-line prefer-destructuring
        columnsOrder = Object.keys(oldObjects[0]);
    }
    // if no field or equality - this is simple concat
    const allObjects = transformFunction
        ? transformFunction({ datasetData: newObjects, spreadsheetData: oldObjects })
        : makeUniqueRows(oldObjects, newObjects, deduplicateByField, deduplicateByEquality);

    const { keys, flattenedData } = flattenArrayOfObjectsAndGetKeys(allObjects);

    // We have to sort and fill empty after we flatten
    const updatedObjects = flattenedData.map((object) => {
        const updatedObj = object;
        keys.forEach((key) => {
            if (!updatedObj[key]) updatedObj[key] = '';
        });
        return sortObj(updatedObj, columnsOrder);
    });
    return updatedObjects;
};
