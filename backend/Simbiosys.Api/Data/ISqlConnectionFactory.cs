namespace Simbiosys.Api.Data;

public interface ISqlConnectionFactory
{
    System.Data.IDbConnection CreateConnection();
}
