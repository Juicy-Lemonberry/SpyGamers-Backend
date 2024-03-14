export const SERVER_SETTINGS = {
    SERVER_PORT: parseInt(process.env.SPYGAMERS_SERVER_PORT as string),
    SERVER_INITIAL_ROUTE_PATH: process.env.SPYGAMERS_INITIAL_ROUTE_PATH,
    LISTEN_ADDRESS: '0.0.0.0'
};

export const APPLICATION_SETTINGS = {
    DEFAULT_MESSAGE_CHUNK_SIZE: 25 // Default message chunk size to fetch for direct messages and group message...
};