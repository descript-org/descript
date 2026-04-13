/**
 * Примеры типизации `required` в descript-блоках
 *
 * Правила:
 *   - required: true  → поле в GetObjectBlockResult НЕ имеет `| DescriptError`
 *   - required: false → поле имеет `| DescriptError` (дефолт)
 *   - .extend() без явного required: false наследует бренд от родителя
 *   - .extend({ options: { required: false } }) снимает бренд
 *
 * Запуск проверки типов: npx tsc --noEmit
 */

import * as de from '../lib';
import { DescriptError } from '../lib/error';

interface UserResult { id: number; name: string; }
interface OrderResult { orderId: string; total: number; }
interface ProfileResult { avatarUrl: string; bio: string; }

// =============================================================================
// ГРУППА 1: required: false — union с DescriptError нужен
// =============================================================================

const blockOptionalProfile = de.http({
    block: { pathname: '/profile' },
    options: {
        required: false,
        after: () => ({ avatarUrl: '/img/me.png', bio: 'Dev' } as ProfileResult),
    },
});

const pageWithOptional = de.object({
    block: {
        user: de.http({
            block: { pathname: '/user' },
            options: { after: () => ({ id: 1, name: 'Alice' } as UserResult) },
        }),
        profile: blockOptionalProfile,
    },
});

async function renderOptional() {
    const result = await de.run(pageWithOptional, { params: {} });

    // user: UserResult | DescriptError — narrowing обязателен
    const user = result.user;
    if (user instanceof DescriptError) return '<error>';

    // profile: ProfileResult | DescriptError — narrowing обязателен
    const profile = result.profile;
    if (profile instanceof DescriptError) {
        return `<page user="${user.name}" avatar="/img/default.png">`;
    }
    return `<page user="${user.name}" avatar="${profile.avatarUrl}">`;
}

void renderOptional;

// =============================================================================
// ГРУППА 2: required: true — union с DescriptError отсутствует
// =============================================================================

const blockRequiredUser = de.http({
    block: { pathname: '/user' },
    options: {
        required: true,
        after: () => ({ id: 1, name: 'Alice' } as UserResult),
    },
});

const pageRequired = de.object({
    block: {
        user: blockRequiredUser,   // required: true → UserResult (без DescriptError)
        profile: blockOptionalProfile, // required: false → ProfileResult | DescriptError
    },
});

async function renderRequired() {
    const result = await de.run(pageRequired, { params: {} });

    // user: UserResult — narrowing НЕ нужен
    const name: string = result.user.name;

    // profile: ProfileResult | DescriptError — narrowing нужен
    const profile = result.profile;
    const avatar = profile instanceof DescriptError ? '/img/default.png' : profile.avatarUrl;

    return `<page user="${name}" avatar="${avatar}">`;
}

void renderRequired;

// =============================================================================
// ГРУППА 3: .extend() наследует бренд — не нужно повторять required: true
// =============================================================================

// Базовый блок с required: true
const baseUserBlock = de.http({
    block: { pathname: '/user' },
    options: { required: true },
});

// extend без указания required — бренд __isRequired сохраняется
const userWithAfter = baseUserBlock.extend({
    options: { after: () => ({ id: 1, name: 'Alice' } as UserResult) },
});

// Цепочка extend — бренд сохраняется на каждом шаге
const userWithTimeout = userWithAfter.extend({
    options: { timeout: 5000 },
});

const pageInherited = de.object({
    block: {
        user: userWithTimeout,  // всё ещё required: true → UserResult (без DescriptError)
        profile: blockOptionalProfile,
    },
});

async function renderInherited() {
    const result = await de.run(pageInherited, { params: {} });

    // user: UserResult — без narrowing, хотя required: true указан только в базовом блоке
    const name: string = result.user.name;

    const profile = result.profile;
    const avatar = profile instanceof DescriptError ? '/img/default.png' : profile.avatarUrl;

    return `<page user="${name}" avatar="${avatar}">`;
}

void renderInherited;

// =============================================================================
// ГРУППА 4: .extend({ required: false }) снимает бренд
// =============================================================================

const baseRequired = de.http({
    block: { pathname: '/user' },
    options: { required: true, after: () => ({ id: 1, name: 'Alice' } as UserResult) },
});

// Явное required: false — бренд снимается
const madeOptional = baseRequired.extend({
    options: { required: false },
});

const pageDowngraded = de.object({
    block: { user: madeOptional },
});

async function renderDowngraded() {
    const result = await de.run(pageDowngraded, { params: {} });

    // user: UserResult | DescriptError — narrowing нужен (бренд снят)
    const user = result.user;
    if (user instanceof DescriptError) return '<error>';
    return `<page user="${user.name}">`;
}

void renderDowngraded;

// =============================================================================
// ГРУППА 5: смешанный сценарий — часть полей required, часть нет
// =============================================================================

const mixedPage = de.object({
    block: {
        user: de.http({
            block: { pathname: '/user' },
            options: { required: true, after: () => ({ id: 1, name: 'Alice' } as UserResult) },
        }),
        order: de.http({
            block: { pathname: '/order' },
            options: { required: true, after: () => ({ orderId: 'ORD-1', total: 99 } as OrderResult) },
        }),
        profile: de.http({
            block: { pathname: '/profile' },
            options: { required: false, after: () => ({ avatarUrl: '/img/me.png', bio: 'Dev' } as ProfileResult) },
        }),
    },
});

// Тип result:
// {
//   user:    UserResult                    ← только тип результата (required: true)
//   order:   OrderResult                   ← только тип результата (required: true)
//   profile: ProfileResult | DescriptError ← union сохранён (required: false)
// }

async function renderMixed() {
    const result = await de.run(mixedPage, { params: {} });

    // Прямой доступ без narrowing для required-полей:
    const userName: string = result.user.name;
    const orderTotal: number = result.order.total;

    // Narrowing только для optional:
    const profile = result.profile;
    const avatar = profile instanceof DescriptError ? '/img/default.png' : profile.avatarUrl;

    return `<page user="${userName}" total="${orderTotal}" avatar="${avatar}">`;
}

void renderMixed;

// =============================================================================
// ГРУППА 6: required: true + error-хук — ручное управление ошибкой
// =============================================================================
//
// error-хук перехватывает ошибку до compositeBlock, поэтому required: true не
// вызывает cancel родителя — блок вернёт результат error-хука.
// Тип поля: BlockResult | ErrorResultOut (без DescriptError).

const blockRequiredWithErrorHook = de.http({
    block: { pathname: '/user' },
    options: {
        required: true,
        after: () => ({ id: 1, name: 'Alice' } as UserResult),
        error: (): UserResult => ({ id: 0, name: 'Guest' }),
    },
});

const pageWithErrorHook = de.object({
    block: { user: blockRequiredWithErrorHook },
});

async function renderWithErrorHook() {
    const result = await de.run(pageWithErrorHook, { params: {} });
    // user: UserResult — без DescriptError (required: true + error-хук возвращает UserResult)
    const name: string = result.user.name;
    return `<page user="${name}">`;
}

void renderWithErrorHook;
