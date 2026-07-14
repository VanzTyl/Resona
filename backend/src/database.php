<?php

/**
 * Resona Database Connection Manager
 *
 * Provides a singleton PDO connection to MySQL (TiDB Cloud).
 * Implements Rule 15 (SQL Prepared Statements) at the connection level.
 *
 * @package Resona
 * @version 1.0.0
 */

/**
 * Get the database PDO connection singleton.
 *
 * @return PDO The active database connection.
 *
 * @throws PDOException If connection fails.
 */
function getDatabaseConnection(): PDO
{
    static $connection = null;

    if ($connection !== null) {
        return $connection;
    }

    $config = getDatabaseConfig();

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['port'],
        $config['name']
    );

    $connection = new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ]);

    return $connection;
}

/**
 * Execute a SELECT query with prepared parameters.
 *
 * @param string $sql    The SQL query with named placeholders.
 * @param array  $params The parameter values to bind.
 *
 * @return array The fetched result set.
 */
function dbQuery(string $sql, array $params = []): array
{
    $connection = getDatabaseConnection();
    $statement = $connection->prepare($sql);
    $statement->execute($params);

    $results = $statement->fetchAll();

    if ($results === false) {
        return [];
    }

    return $results;
}

/**
 * Execute a SELECT query returning a single row.
 *
 * @param string $sql    The SQL query with named placeholders.
 * @param array  $params The parameter values to bind.
 *
 * @return array|null The single row or null if not found.
 */
function dbQueryOne(string $sql, array $params = []): ?array
{
    $connection = getDatabaseConnection();
    $statement = $connection->prepare($sql);
    $statement->execute($params);

    $result = $statement->fetch();

    if ($result === false) {
        return null;
    }

    return $result;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement.
 *
 * @param string $sql    The SQL query with named placeholders.
 * @param array  $params The parameter values to bind.
 *
 * @return int The number of affected rows.
 */
function dbExecute(string $sql, array $params = []): int
{
    $connection = getDatabaseConnection();
    $statement = $connection->prepare($sql);
    $statement->execute($params);

    return $statement->rowCount();
}

/**
 * Get the last inserted row ID.
 *
 * @return string The last insert ID.
 */
function dbLastInsertId(): string
{
    $connection = getDatabaseConnection();

    return $connection->lastInsertId();
}

/**
 * Begin a database transaction.
 *
 * @return bool True on success.
 */
function dbBeginTransaction(): bool
{
    $connection = getDatabaseConnection();

    return $connection->beginTransaction();
}

/**
 * Commit the current database transaction.
 *
 * @return bool True on success.
 */
function dbCommit(): bool
{
    $connection = getDatabaseConnection();

    return $connection->commit();
}

/**
 * Roll back the current database transaction.
 *
 * @return bool True on success.
 */
function dbRollback(): bool
{
    $connection = getDatabaseConnection();

    return $connection->rollBack();
}
