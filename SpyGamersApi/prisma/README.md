For organization/cleaniness sake, split up each database model/enum in the file as `FILE_NAME.part.prisma`.

When attempting to perform migration/generations, do:
```
cat *.part.prisma > schema.prisma
```

It should generate a `schema.prisma` to properly perform migrations and generations.