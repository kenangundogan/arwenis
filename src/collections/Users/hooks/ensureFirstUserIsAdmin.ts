import path from 'path'
import fs from 'fs/promises'
import type { CollectionBeforeValidateHook } from 'payload'

export const ensureFirstUserIsAdmin: CollectionBeforeValidateHook = async ({
    data,
    req,
    operation,
}) => {
    const { payload } = req

    if (operation === 'create') {

        const users = await payload.find({
            collection: 'users',
            limit: 0,
            req,
        })

        if (users.totalDocs === 0) {
            payload.logger.info('İlk kullanıcı oluşturuluyor, Admin rolü atanacak...')

            const adminRoleResult = await payload.find({
                collection: 'roles',
                where: {
                    slug: {
                        equals: 'admin'
                    }
                },
                limit: 1,
                req,
            })

            let adminRoleId;

            if (adminRoleResult.docs.length > 0) {
                adminRoleId = adminRoleResult.docs[0].id
            } else {

                payload.logger.info('Admin rolü bulunamadı, oluşturuluyor...')
                const newRole = await payload.create({
                    collection: 'roles',
                    data: {
                        title: 'Admin',
                        description: 'Sistem Yöneticisi (Otomatik Oluşturuldu)',
                        slug: 'admin',
                        permissions: ['create', 'read', 'update', 'delete'],
                        _status: 'published',
                    },
                    req,
                    overrideAccess: true,
                })
                adminRoleId = newRole.id
            }

            if (data) {

                data.roles = adminRoleId

                if (!data.firstName) data.firstName = 'Admin'
                if (!data.lastName) data.lastName = 'User'

                if (!data.gender) {
                    const genderSlug = 'belirtilmemis'
                    const genderResult = await payload.find({
                        collection: 'genders',
                        where: {
                            slug: {
                                equals: genderSlug
                            }
                        },
                        limit: 1,
                        req,
                    })

                    let genderId
                    if (genderResult.docs.length > 0) {
                        genderId = genderResult.docs[0].id
                    } else {
                        payload.logger.info('Varsayılan cinsiyet bulunamadı, oluşturuluyor...')
                        const newGender = await payload.create({
                            collection: 'genders',
                            data: {
                                title: 'Belirtilmemiş',
                                description: 'Sistem tarafından otomatik oluşturulan varsayılan cinsiyet.',
                                _status: 'published',
                            },
                            req,
                            overrideAccess: true,
                        } as any)
                        genderId = newGender.id
                    }
                    data.gender = genderId
                }

                const uploadDummyImage = async (filename: string, validationType: string) => {
                    const filePath = path.resolve(process.cwd(), 'public/assets/images/dummy', filename)
                    try {

                        await fs.access(filePath)

                        const existingMedia = await payload.find({
                            collection: 'media',
                            where: {
                                alt: { equals: `Dummy ${validationType}` }
                            },
                            limit: 1,
                            req,
                        })

                        if (existingMedia.totalDocs > 0) {
                            return existingMedia.docs[0].id
                        }

                        const fileBuffer = await fs.readFile(filePath)
                        const stats = await fs.stat(filePath)

                        const media = await payload.create({
                            collection: 'media',
                            data: {
                                alt: `Dummy ${validationType}`,
                            },
                            file: {
                                data: fileBuffer,
                                name: filename,
                                mimetype: 'image/jpeg',
                                size: stats.size,
                            },
                            req,
                            overrideAccess: true,
                        })
                        payload.logger.info(`Dummy image yüklendi: ${filename}`)
                        return media.id
                    } catch (error) {
                        payload.logger.error(`Dummy image yüklenemedi (${filename}): ${error}`)
                        return null
                    }
                }

                if (!data.images) data.images = {}

                if (!data.images.ratio16x9) {
                    data.images.ratio16x9 = await uploadDummyImage('image-dummy-16x9.jpg', '16x9')
                }

                if (!data.images.ratio9x16) {
                    data.images.ratio9x16 = await uploadDummyImage('image-dummy-9x16.jpg', '9x16')
                }

                if (!data.images.ratio1x1) {
                    data.images.ratio1x1 = await uploadDummyImage('image-dummy-1x1.jpg', '1x1')
                }
            }
        }
    }

    return data
}
