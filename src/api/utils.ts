export async function handleErrors(prefix: string, response: Response) {
    if (!response.ok) {
        const body = await response.json()
        throw Error(`${prefix}: ${body.message || response.statusText}`);
    }
}