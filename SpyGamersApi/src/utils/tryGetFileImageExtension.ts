function _decodeToBuffer(encodedString: string): Buffer {
    return Buffer.from(encodedString, 'base64');
}

export function tryGetFileImageExtension(encodedString: string): undefined | string {
    const pngMagicNumber = '89504e47'; // PNG magic number (hexadecimal)
    const jpegMagicNumber = 'ffd8ffe0'; // JPEG magic number (hexadecimal)

    // Convert the first few bytes of the buffer to hexadecimal
    const magicNumber = _decodeToBuffer(encodedString).toString('hex', 0, 4);

    // Check if the magic number matches PNG or JPEG

    if (pngMagicNumber === magicNumber){
        return "png";
    }

    if (magicNumber === jpegMagicNumber){
        return "png";
    }

    return undefined;
}