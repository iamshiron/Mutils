namespace Mutils.Core.Entities;

public enum KakeraType {
    Purple,
    Blue,
    Green,
    Yellow,
    Orange,
    Red,
    Rainbow,
    Light,
    Chaos,
    Dark,
    Teal,
    Bku
}

public class KakeraClaim : BaseEntity {
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public Guid? CharacterId { get; set; }
    public Character? Character { get; set; }
    
    public KakeraType Type { get; set; }
    public int Value { get; set; }
    public bool IsClaimed { get; set; }
    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
}
