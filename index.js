module.exports = TextDiffBinding;

function TextDiffBinding(codemirror) {
    this.codemirror = codemirror;
}

TextDiffBinding.prototype._get =
    TextDiffBinding.prototype._insert =
        TextDiffBinding.prototype._remove = function() {
            throw new Error('`_get()`, `_insert(index, length)`, and `_remove(index, length)` prototype methods must be defined.');
        };

TextDiffBinding.prototype._getElementValue = function() {
    var value = this.codemirror.getValue();
    // IE and Opera replace \n with \r\n. Always store strings as \n
    console.log('value = ', value);
    return value.replace(/\r\n/g, '\n');
};

TextDiffBinding.prototype._getInputEnd = function(previous, value) {
    if (this.codemirror !== document.activeElement) return null;
    var end = value.length - this.codemirror.getCursor(true);
    if (end === 0) return end;
    if (previous.slice(previous.length - end) !== value.slice(value.length - end)) return null;
    return end;
};

TextDiffBinding.prototype.onInput = function() {
    console.log('on input');
    var previous = this._get();
    var value = this._getElementValue();
    if (previous === value) return;

    var start = 0;
    // Attempt to use the DOM cursor position to find the end
    var end = this._getInputEnd(previous, value);
    if (end === null) {
        // If we failed to find the end based on the cursor, do a diff. When
        // ambiguous, prefer to locate ops at the end of the string, since users
        // more frequently add or remove from the end of a text input
        while (previous.charAt(start) === value.charAt(start)) {
            start++;
        }
        end = 0;
        while (
            previous.charAt(previous.length - 1 - end) === value.charAt(value.length - 1 - end) &&
            end + start < previous.length &&
            end + start < value.length
            ) {
            end++;
        }
    } else {
        while (
            previous.charAt(start) === value.charAt(start) &&
            start + end < previous.length &&
            start + end < value.length
            ) {
            start++;
        }
    }

    if (previous.length !== start + end) {
        var removed = previous.slice(start, previous.length - end);
        this._remove(start, removed);
    }
    if (value.length !== start + end) {
        var inserted = value.slice(start, value.length - end);
        this._insert(start, inserted);
    }
};

TextDiffBinding.prototype.onInsert = function(index, length) {
    console.log('on insert');
    this._transformSelectionAndUpdate(index, length, insertCursorTransform);
};
function insertCursorTransform(index, length, cursor) {
    return (index < cursor) ? cursor + length : cursor;
}

TextDiffBinding.prototype.onRemove = function(index, length) {
    this._transformSelectionAndUpdate(index, length, removeCursorTransform);
};
function removeCursorTransform(index, length, cursor) {
    return (index < cursor) ? cursor - Math.min(length, cursor - index) : cursor;
}

TextDiffBinding.prototype._transformSelectionAndUpdate = function(index, length, transformCursor) {
    console.log("tranform and update");
    if (document.activeElement === this.codemirror) {
        console.log('active element');
        var selectionStart = transformCursor(index, length, this.codemirror.getCursor(true));
        console.log("selections start", selectionStart);
        var selectionEnd = transformCursor(index, length, this.codemirror.getCursor(false));
        console.log("selections end", selectionEnd);
        // var selectionDirection = this.element.selectionDirection;
        this.update();
        this.codemirror.setSelection(selectionStart, selectionEnd);
    } else {
        console.log("else");
        this.update();
    }
};

TextDiffBinding.prototype.update = function() {
    console.log('update');
    var value = this._get();
    if (this._getElementValue() === value) return;
    this.codemirror.setValue(value);
};
